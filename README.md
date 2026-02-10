# API Command Center

> **"One more thing..."** - A revolutionary way to manage your AI infrastructure.

A cinematic, presentation-style dashboard for managing AI APIs with command-line power. Inspired by Steve Jobs' iconic presentations and TEDx's bold storytelling.

![API Command Center](https://img.shields.io/badge/Status-Production-success)
![Version](https://img.shields.io/badge/Version-2.0-blue)
![License](https://img.shields.io/badge/License-MIT-green)

## ✨ Features

### 🎭 Presentation Dashboard
Navigate through your API metrics like a keynote presentation:
- **Giant, animated stats** - One powerful metric at a time
- **Cinematic transitions** - Smooth slide navigation with keyboard/swipe
- **Real-time data** - Live token usage, costs, and performance

### 💻 Command Terminal
Configure your AI applications via CLI:
```bash
$ config openclaw --primary gpt-4-turbo --fallback claude-3-sonnet
✓ OpenClaw configured successfully

$ list models
Available models:
  • gpt-4-turbo      ($0.01/1k)  [OpenAI]
  • claude-3-opus    ($0.015/1k) [Anthropic]
  • gemini-pro       ($0.0005/1k)[Google]
```

### ⚙️ Visual Configurator
Hybrid interface for power users and beginners:
- Select models visually with live pricing
- See generated commands in real-time
- One-click apply or copy to clipboard
- Export configurations as JSON

### 📊 AI Applications Supported
- **OpenClaw** - AI-powered code assistant
- **MoltBot** - Conversational AI assistant
- **Custom Apps** - Add your own applications

## 🚀 Quick Start

### Local Development
```bash
# Clone the repository
git clone <your-repo-url>
cd api-dashboard

# Open in browser
# Simply open index.html in your browser
# No build process required!
```

### Deploy to Vercel

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit: API Command Center"
   git remote add origin <your-repo-url>
   git push -u origin main
   ```

2. **Deploy to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Configure:
     - **Framework Preset**: Other
     - **Build Command**: (leave empty)
     - **Output Directory**: `.` (root)
   - Click "Deploy"

3. **Set Custom Domain**
   - Go to Project Settings → Domains
   - Add custom domain: `api-command.mytestbed.tech`
   - Update DNS records as instructed

## 📖 Usage Guide

### Terminal Commands

| Command | Description | Example |
|---------|-------------|---------|
| `help` | Show all commands | `help` |
| `list apps` | Show AI applications | `list apps` |
| `list models` | Show available models | `list models` |
| `show config <app>` | Display app configuration | `show config openclaw` |
| `config <app> --primary <model> --fallback <model>` | Configure models | `config openclaw --primary gpt-4-turbo --fallback claude-3-sonnet` |
| `export <app>` | Export config as JSON | `export openclaw` |
| `clear` | Clear terminal | `clear` |

### Keyboard Shortcuts

- **Arrow Left/Right** - Navigate slides (Dashboard view)
- **Arrow Up** - Previous command (Terminal view)
- **Enter** - Execute command (Terminal view)

### Data Persistence

All configurations are stored in browser LocalStorage:
- AI application settings
- Command history
- Usage statistics

To reset: Clear browser data for the site.

## 🏗️ Architecture

### Tech Stack
- **HTML5** - Semantic structure
- **Vanilla CSS** - Pure black stage aesthetic with gradients
- **Vanilla JavaScript** - No frameworks, no dependencies
- **LocalStorage** - Client-side data persistence

### Design Philosophy
- **Minimalist** - Pure black background, high-contrast typography
- **Bold** - 96px headlines, dramatic spotlights
- **Revolutionary** - Cinematic reveals, typewriter effects
- **Responsive** - Works on all screen sizes

### File Structure
```
api-dashboard/
├── index.html          # Main HTML structure
├── styles.css          # Cinematic design system
├── app.js              # Application logic
├── vercel.json         # Deployment configuration
├── .gitignore          # Git exclusions
└── README.md           # This file
```

## 🎨 Customization

### Add New AI Application
Edit `app.js` and add to `getMockApps()`:
```javascript
{
    id: 'myapp',
    name: 'My App',
    description: 'My AI application',
    icon: 'MA',
    primaryModel: { provider: 'openai', model: 'gpt-4-turbo', costPer1k: 0.01 },
    fallbackModel: { provider: 'anthropic', model: 'claude-3-sonnet', costPer1k: 0.003 }
}
```

### Add New Model
Edit `app.js` and add to `MODELS`:
```javascript
'my-model': { provider: 'myprovider', name: 'My Model', costPer1k: 0.005 }
```

### Change Color Scheme
Edit `styles.css` root variables:
```css
:root {
    --accent-primary: #667eea;  /* Change to your color */
    --accent-secondary: #764ba2;
}
```

## 📱 Responsive Design

- **Desktop (1920px+)**: Full presentation mode with large typography
- **Laptop (1366px-1920px)**: Scaled presentation mode
- **Tablet (768px-1366px)**: Hybrid mode with adjusted layouts
- **Mobile (375px-768px)**: Simplified single-column layout

## 🔒 Security

- No external API calls (fully client-side)
- No sensitive data transmission
- LocalStorage only (user's browser)
- Security headers configured in `vercel.json`

## 📄 License

MIT License - Feel free to use for personal or commercial projects

## 🙏 Credits

Inspired by:
- **Steve Jobs** - Apple Keynote presentations
- **TEDx** - Bold stage design and storytelling
- **Terminal aesthetics** - Classic CRT green glow

---

**Built with ❤️ for the AI revolution**

*"Think Different"*
