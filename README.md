# Swifttasks

## Resources to learn from

- [TailwindCSS VScode Extention (Recommended)](https://marketplace.visualstudio.com/items?itemName=bradlc.vscode-tailwindcss)
- [Tailwindcss Docs](https://tailwindcss.com/docs/installation/using-vite);
- [Next.js (react)](https://nextjs.org/docs)
  <br/>
- [React.js Basics YT](https://www.youtube.com/watch?v=SqcY0GlETPk&pp=ygUOcmVhY3RqcyBiYXNpY3M%3D)
- [Tailwindcss Basics YT](https://www.youtube.com/watch?v=pfaSUYaSgRo&pp=ygUSdGFpbHdpbmRjc3MgYmFzaWNz)
  <br/>
#### Any problems or specific questions, use ai.
- [ChatGPT](https://chatgpt.com)
- [Claude (Recommended)](https://claude.ai/new)
- [Gemini](https://gemini.google.com/app)

## Github Advice

_Pulling down the repo_

```sh
git clone https://github.com/Swift-Tasks/SwiftTasks
```

_Update your code - do this whenever you reopen the project on a new date, or before you commit_

```sh
git pull
```

_Commit your changes - stick to your folders from trello_

```sh
git add .
git commit -m "EXPLAIN YOUR CHANGES HERE IN DEPTH - YOUR NAME - DATE"
git push --set-upstream origin main
```

### Database Setup (only do this once)

*Add environment variables from teasms chat.*

```sh
bunx drizzle-kit generate
```

```sh
bunx drizzle-kit migrate
```