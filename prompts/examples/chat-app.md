Create a new TypeScript and React-based project using Vite called `chat-app` that lets users chat with an AI Assistant. 

-----------------------------------------------
0. Notes on user experience
-----------------------------------------------
- single page that has a text input and a button to send messages
- when the user clicks a button, send the message to the LLM and display the response
- very clean and simple is the goal
- colorful and visually appealing
- easy to use

-----------------------------------------------
1. LLM INTEGRATION
- Use the `@anthropic-ai/sdk` package to make API calls to the Anthropic API
- save conversation history in the browser's local storage
- provide a button to start a new conversation, or load a previous conversation from stored history
- provide a button to delete a conversation
- pass conversation history to the LLM
- Create a `.env` file in project with the Anthropic API key as `ANTHROPIC_API_KEY = "..."` (you can copy the value from the current project's .env file if available) and use that with the `@anthropic-ai/sdk` package to make API calls. 
- IMPORTANT: We are going to be using the anthropic SDK in the browser, so when you create a new anthropic client, you will need to pass in the `dangerouslyAllowBrowser` flag like `new Anthropic({ apiKey, dangerouslyAllowBrowser: true });`


-----------------------------------------------
2. MARKDOWN IN MESSAGES
-----------------------------------------------
- chat messages that contain markdown need to be displayed correctly including `inline code` and ```<language> code blocks```. 
- Use a popular npm library to handle the correct rendering of markdown. 
- provide the ability for the user to copy the markdown to the clipboard.
