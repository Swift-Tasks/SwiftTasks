# AI Markdown Comments System

## Overview

The AI assistant uses **HTML comments** to provide explanations, suggestions, and change descriptions that are **invisible in read mode** but **visible in edit mode** of the tasks page.

## Why HTML Comments?

- ✅ **Invisible in rendered view** - Users see clean, professional markdown
- ✅ **Visible in edit mode** - Users can see AI's reasoning and suggestions
- ✅ **Standard markdown syntax** - Compatible with all markdown parsers
- ✅ **Non-intrusive** - Doesn't affect document structure or formatting

## Comment Syntax

```markdown
<!-- Your explanation, suggestion, or note here -->
```

## How It Works

### 1. AI Prompt System

The AI is given strict instructions to:

- Return **ONLY markdown** - no prose explanations
- **NEVER** include meta-commentary like "Here's the improved version"
- Use **HTML comments** for any explanations or suggestions
- Start responses immediately with markdown content

### 2. Example Interactions

#### Example 1: Improving Text Quality

**AI Response:**

```markdown
<!-- Changed "utilize" to "use" for clarity and simplified sentence structure -->

# Task Overview

This document outlines the key objectives we need to accomplish.
```

**In Edit Mode:** You see the comment explaining the change
**In Read Mode:** You only see the clean heading and text

#### Example 2: Adding Suggestions

**AI Response:**

```markdown
## Project Goals

- Complete user authentication
- Implement dashboard
<!-- Suggestion: Consider adding analytics tracking as a stretch goal -->
- Deploy to production
```

**In Edit Mode:** You see the suggestion comment between items
**In Read Mode:** You only see the clean bulleted list

#### Example 3: Fixing Issues

**AI Response:**

```markdown
<!-- Fixed: Corrected spelling of "receive" and improved grammar -->

When you receive feedback, make sure to address it promptly.
```

**In Edit Mode:** You understand what was corrected
**In Read Mode:** You see the corrected sentence only

### 3. Markdown Component Implementation

The custom markdown renderer includes a special handler:

```tsx
// HTML comments are rendered as null (invisible)
comment: () => null,

// Text nodes filter out any stray comment syntax
text: ({ value }: any) => {
  if (typeof value === 'string' && value.trim().startsWith('<!--')) {
    return null;
  }
  return <>{value}</>;
},
```

## Use Cases

### For AI Improvements

- **Grammar fixes**: `<!-- Fixed: Changed "their" to "there" -->`
- **Clarity improvements**: `<!-- Rephrased for better clarity -->`
- **Structure changes**: `<!-- Reorganized into logical sections -->`

### For AI Suggestions

- **Feature ideas**: `<!-- Suggestion: Add error handling here -->`
- **Best practices**: `<!-- Note: Consider using async/await pattern -->`
- **Warnings**: `<!-- Warning: This approach may have performance issues -->`

### For AI Explanations

- **Reasoning**: `<!-- Explanation: Split long paragraph for readability -->`
- **Context**: `<!-- Added context about the project background -->`
- **Choices made**: `<!-- Chose active voice over passive for impact -->`

## Benefits

1. **Clean Output**: Read mode shows only the polished content
2. **Transparent Process**: Edit mode reveals AI's thought process
3. **Learning Tool**: Users can understand why changes were made
4. **Flexible**: Comments can be kept, edited, or removed
5. **Professional**: Final output is clean and presentation-ready

## Technical Details

### Prompt Structure

Every AI request includes:

```
CRITICAL RULES - YOU MUST FOLLOW THESE EXACTLY:
1. Return ONLY valid markdown - no prose explanations
2. NEVER include phrases like "Here's the improved version"
3. If you need to explain changes, use HTML comments
4. HTML comment syntax: <!-- Your explanation here -->
5. Start your response immediately with markdown content

EXAMPLES OF CORRECT USAGE:
[... examples ...]

NOW PROCESS THE CONTENT BELOW:
[... user's content ...]
```

### Rendering Pipeline

1. **User types in Edit Mode** (Monaco Editor)
2. **AI processes** with strict markdown-only rules
3. **AI returns** markdown with HTML comments
4. **Edit Mode** shows everything (including comments)
5. **Read Mode** uses custom renderer that hides comments

### Markdown Parser Configuration

Uses `rehype-raw` to parse HTML comments:

- Comments are parsed as HTML nodes
- Custom component renders them as `null`
- Result: invisible in rendered output

## Best Practices for AI

The AI follows these guidelines:

✅ **DO:**

- Use comments for explanations
- Keep comments concise
- Place comments near relevant content
- Use clear, actionable language

❌ **DON'T:**

- Add prose before markdown
- Say "Here's the improved version"
- Include meta-commentary in main content
- Over-explain simple changes

## Examples in Practice

### Bad Response (Old System)

```
Here's the improved version of your content with better clarity and structure:

# Project Overview
This project aims to...

I've made the following changes:
- Simplified the introduction
- Added bullet points for clarity
- Fixed grammar issues
```

### Good Response (New System)

```markdown
<!-- Simplified introduction, added bullet points for clarity, fixed "its/it's" grammar error -->

# Project Overview

This project aims to accomplish three main goals:

- Deliver exceptional user experience
- Maintain high code quality
- Ship on schedule

<!-- Suggestion: Consider adding a timeline section below -->
```

## Future Enhancements

Potential improvements:

- **Comment categories**: `<!-- [SUGGESTION] ... -->`, `<!-- [FIX] ... -->`
- **Comment folding**: Collapse/expand in edit mode
- **Comment highlighting**: Different colors for types
- **Comment statistics**: Track AI suggestions usage

## Conclusion

This system provides the best of both worlds:

- **Professional output** for presentations and sharing
- **Educational value** for learning and understanding
- **Transparency** in AI-assisted editing
- **Flexibility** to keep or remove AI notes

The result is a more trustworthy, understandable, and useful AI assistant that respects markdown conventions while providing valuable insights.
