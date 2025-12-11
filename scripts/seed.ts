import { db } from "../src/server/db/index";
import { assignment, task, user } from "../src/server/db/schema";
import { eq } from "drizzle-orm";

async function seed() {
  console.log("🌱 Seeding database...");

  const users = await db.select().from(user).limit(1);

  if (users.length === 0) {
    console.error("❌ No users found in database. Please sign up first.");
    process.exit(1);
  }

  const testUser = users[0];
  console.log(`✅ Using user: ${testUser.email}`);

  const assignmentId = `assignment_${Date.now()}`;
  const deadline = new Date();
  deadline.setDate(deadline.getDate() + 7);

  await db.insert(assignment).values({
    id: assignmentId,
    name: "Introduction to Web Development",
    taskIds: "", 
    userId: testUser.id,
    deadline,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  console.log(`✅ Created assignment: Introduction to Web Development`);

  // Create 4 example tasks
  const tasks = [
    {
      id: `task_${Date.now()}_1`,
      name: "HTML Basics",
      description: "Learn the fundamentals of HTML structure and elements",
      body: `# HTML Basics

## Objectives
- Understand HTML document structure
- Learn common HTML elements
- Create semantic markup

## Topics to Cover

### 1. Document Structure
\`\`\`html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>My Page</title>
</head>
<body>
    <!-- Content goes here -->
</body>
</html>
\`\`\`

### 2. Common Elements
- **Headings**: \`<h1>\` to \`<h6>\`
- **Paragraphs**: \`<p>\`
- **Links**: \`<a href="url">text</a>\`
- **Images**: \`<img src="url" alt="description">\`

### 3. Lists
- Unordered lists (\`<ul>\`)
- Ordered lists (\`<ol>\`)
- List items (\`<li>\`)

---

**Assignment**: Create a personal webpage with proper HTML structure.`,
      userId: testUser.id,
      assignmentId,
      bookmarked: 0,
      finished: 0,
      deadline,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: `task_${Date.now()}_2`,
      name: "CSS Styling",
      description: "Master CSS selectors, properties, and the box model",
      body: `# CSS Styling

## Learning Goals
- Understand CSS syntax
- Master selectors and specificity
- Learn the box model

## Key Concepts

### 1. CSS Syntax
\`\`\`css
selector {
    property: value;
}
\`\`\`

### 2. Common Selectors
- **Element**: \`p { color: blue; }\`
- **Class**: \`.my-class { font-size: 16px; }\`
- **ID**: \`#my-id { background: red; }\`

### 3. Box Model
Every element has:
1. **Content** - The actual content
2. **Padding** - Space around content
3. **Border** - Border around padding
4. **Margin** - Space outside border

### 4. Layout Properties
- \`display\`: block, inline, flex, grid
- \`position\`: static, relative, absolute, fixed
- \`float\`: left, right, none

---

**Task**: Style your HTML page with colors, fonts, and layouts.`,
      userId: testUser.id,
      assignmentId,
      bookmarked: 1,
      finished: 0,
      deadline,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: `task_${Date.now()}_3`,
      name: "JavaScript Fundamentals",
      description: "Learn JavaScript basics, variables, and control flow",
      body: `# JavaScript Fundamentals

## Overview
JavaScript brings interactivity to web pages. Master the basics first!

## Topics

### 1. Variables and Data Types
\`\`\`javascript
// Modern variable declarations
let name = "John";
const age = 25;

// Data types
let string = "text";
let number = 42;
let boolean = true;
let array = [1, 2, 3];
let object = { key: "value" };
\`\`\`

### 2. Functions
\`\`\`javascript
// Function declaration
function greet(name) {
    return \`Hello, \${name}!\`;
}

// Arrow function
const add = (a, b) => a + b;
\`\`\`

### 3. Control Flow
- **Conditionals**: if/else, switch
- **Loops**: for, while, forEach
- **Logic**: &&, ||, !

### 4. DOM Manipulation
\`\`\`javascript
// Select elements
const element = document.querySelector('.my-class');

// Modify content
element.textContent = "New text";

// Add event listener
element.addEventListener('click', () => {
    console.log("Clicked!");
});
\`\`\`

---

**Practice**: Add interactive features to your webpage.`,
      userId: testUser.id,
      assignmentId,
      bookmarked: 0,
      finished: 1,
      deadline,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: `task_${Date.now()}_4`,
      name: "Responsive Design",
      description: "Create mobile-friendly layouts with media queries",
      body: `# Responsive Design

## Goal
Build websites that work on all devices and screen sizes.

## Core Concepts

### 1. Viewport Meta Tag
\`\`\`html
<meta name="viewport" content="width=device-width, initial-scale=1.0">
\`\`\`

### 2. Flexible Layouts
Use percentages instead of fixed widths:
\`\`\`css
.container {
    width: 100%;
    max-width: 1200px;
    margin: 0 auto;
}
\`\`\`

### 3. Media Queries
\`\`\`css
/* Mobile first approach */
.column {
    width: 100%;
}

/* Tablet and up */
@media (min-width: 768px) {
    .column {
        width: 50%;
    }
}

/* Desktop and up */
@media (min-width: 1024px) {
    .column {
        width: 33.333%;
    }
}
\`\`\`

### 4. Flexbox for Layouts
\`\`\`css
.flex-container {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
}

.flex-item {
    flex: 1 1 300px;
}
\`\`\`

### 5. Best Practices
- ✅ Mobile-first approach
- ✅ Use relative units (rem, em, %)
- ✅ Test on multiple devices
- ✅ Optimize images for different sizes

---

**Final Project**: Make your entire website responsive!`,
      userId: testUser.id,
      assignmentId,
      bookmarked: 0,
      finished: 0,
      deadline,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  // Insert all tasks
  for (const taskData of tasks) {
    await db.insert(task).values(taskData);
    console.log(`✅ Created task: ${taskData.name}`);
  }

  // Update assignment with task IDs
  const taskIds = tasks.map((t) => t.id).join(",");
  await db
    .update(assignment)
    .set({ taskIds })
    .where(eq(assignment.id, assignmentId));

  console.log("\n🎉 Database seeded successfully!");
  console.log(`\nCreated:`);
  console.log(`  - 1 Assignment: "Introduction to Web Development"`);
  console.log(`  - 4 Tasks: HTML, CSS, JavaScript, Responsive Design`);
  console.log(`\nTask IDs:`);
  tasks.forEach((t, i) => {
    console.log(`  ${i + 1}. ${t.id} - ${t.name}`);
  });
}

seed()
  .catch((error) => {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  })
  .finally(() => {
    console.log("\n✨ Seed script complete");
    process.exit(0);
  });
