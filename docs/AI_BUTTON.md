# AI Button Component

A sophisticated AI-powered button component that integrates with Ollama to provide intelligent suggestions and improvements for markdown content. **The Ollama URL is kept server-side for security and never exposed to the browser.**

## Features

✨ **Smart Text Processing**

- Process full task content or just selected text
- Automatic detection of selection vs. full content mode
- Real-time text selection tracking

🔒 **Secure Architecture**

- Ollama URL hidden on server-side (no NEXT*PUBLIC* exposure)
- All AI requests proxied through `/api/ollama` endpoint
- No sensitive configuration exposed to browser

🎨 **Beautiful UI**

- Glowing effect on hover using the `GlowingEffect` component
- Sparkles icon with animated processing state
- Clean white button design that works in light/dark mode
- Smooth animations and transitions

⚡ **Performance Optimized**

- Streaming responses for better UX
- Request cancellation support
- Memoized component to prevent unnecessary re-renders
- Efficient API communication
- Auto-detects Ollama configuration on mount

🛡️ **Robust Error Handling**

- Connection error detection with helpful messages
- Retry logic built-in
- User-friendly toast notifications
- Graceful degradation

## Usage

```tsx
import { AIButton } from "@/components/ai-button";

function MyComponent() {
  const [content, setContent] = useState("# My Task");
  const [selectedText, setSelectedText] = useState("");

  return (
    <AIButton
      content={content}
      selectedText={selectedText}
      onContentUpdate={(newContent) => {
        setContent(newContent);
      }}
    />
  );
}
```

## Props

| Prop              | Type                           | Default  | Description                                    |
| ----------------- | ------------------------------ | -------- | ---------------------------------------------- |
| `content`         | `string`                       | required | The full markdown content to process           |
| `selectedText`    | `string`                       | `""`     | Currently selected/highlighted text (optional) |
| `onContentUpdate` | `(newContent: string) => void` | required | Callback when AI generates new content         |
| `className`       | `string`                       | `""`     | Additional CSS classes                         |
| `disabled`        | `boolean`                      | `false`  | Disable the button                             |

## Environment Variables

Configure Ollama on the **server-side** (not exposed to browser):

```bash
# .env or .env.local
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2  # optional, defaults to llama3.2
```

**Important:** Do NOT use `NEXT_PUBLIC_` prefix. These are server-only variables for security.

## Ollama Setup

### Installation

1. **Install Ollama**: Visit [ollama.ai](https://ollama.ai/download) and download for your platform

2. **Start Ollama**:

   ```bash
   ollama serve
   ```

3. **Pull a model**:
   ```bash
   ollama pull llama3.2
   ```

### Recommended Models

- **llama3.2** - Best balance of speed and quality (default)
- **llama3.1** - More powerful but slower
- **mistral** - Fast and efficient
- **codellama** - Optimized for code
- **phi3** - Lightweight and fast

## Integration Example

The component is already integrated into the task detail page at:
`/src/app/dashboard/tasks/[id]/page.tsx`

### How it works in the task page:

1. **Text Selection Detection**: Monaco editor tracks cursor selection automatically
2. **Contextual Processing**:
   - If text is selected → Improves only the selected portion
   - If no selection → Processes entire task content
3. **Content Update**: Updates the editor with AI suggestions
4. **Visual Feedback**: Toast notifications for all states (loading, success, error)

## API Architecture

```
User clicks AI button
    ↓
Component checks if Ollama is configured (GET /api/ollama)
    ↓
Component validates content
    ↓
Shows loading toast
    ↓
Sends request to /api/ollama (server-side)
    ↓
Server proxies to Ollama (URL hidden)
    ↓
Streams response chunks back to client
    ↓
Accumulates full response
    ↓
Updates content via callback
    ↓
Shows success toast
```

### Security Benefits

- ✅ Ollama URL never exposed to browser
- ✅ No NEXT*PUBLIC* variables with sensitive URLs
- ✅ Server-side validation and error handling
- ✅ Can add authentication/rate limiting to API route
- ✅ Works behind corporate firewalls

## Error Handling

The component handles several error scenarios:

- **Connection Errors**: Detects when Ollama is not running
- **Empty Response**: Validates AI output
- **Network Issues**: Provides clear error messages
- **Request Cancellation**: Supports aborting ongoing requests

## Performance Considerations

- **Memoization**: Component is wrapped with `React.memo`
- **Callback Optimization**: Uses `useCallback` for stable references
- **Streaming**: Large responses are streamed for better UX
- **Cleanup**: Properly cancels requests on unmount
- **Request Debouncing**: Single request at a time

## API Endpoint

### GET /api/ollama

Check if Ollama is configured.

**Response:**

```json
{
  "configured": true,
  "model": "llama3.2"
}
```

### POST /api/ollama

Send AI request with streaming response.

**Request:**

```json
{
  "prompt": "Please improve the following text..."
}
```

**Response:** Streamed JSON lines (SSE format)

## Styling

The button uses:

- **Glowing Effect**: White glowing border animation on hover
- **Sparkles Icon**: From `lucide-react`
- **Tailwind CSS**: Fully responsive and theme-aware
- **Dark Mode**: Maintains white appearance in both modes
- **Disabled State**: Greyed out with helpful tooltip when not configured

## Troubleshooting

### "Ollama not configured"

- Set `OLLAMA_URL=http://localhost:11434` in your `.env` file
- Restart the Next.js development server
- Check the API endpoint: `http://localhost:3000/api/ollama`

### "Cannot connect to Ollama"

- Ensure Ollama is installed and running: `ollama serve`
- Check the URL in `.env` is correct
- Verify firewall settings if using remote Ollama
- Test Ollama directly: `curl http://localhost:11434/api/tags`

### "No response generated from AI"

- Try a different model in `.env`: `OLLAMA_MODEL=mistral`
- Check Ollama logs: `ollama logs`
- Ensure the model is pulled: `ollama list`

### Button shows "Loading..." or is disabled

- Check `/api/ollama` endpoint returns `configured: true`
- Verify `OLLAMA_URL` is set in `.env`
- Check browser console for errors
- Ensure content prop is not empty

## License

Part of the SwiftTasks project.
