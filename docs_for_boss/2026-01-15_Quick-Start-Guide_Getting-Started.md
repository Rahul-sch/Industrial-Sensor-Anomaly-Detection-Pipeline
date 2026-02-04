# Rig Alpha 3D Digital Twin - Quick Start Guide

## Current Issues & Fixes

### Issue 1: psycopg2-binary build error
**Problem:** `pg_config executable not found`
**Fix:** It's already installed, skip it. The other packages will install fine.

```powershell
cd C:\Users\rahul\Desktop\stubby\stub
pip install flask-socketio==5.3.6 python-socketio==5.10.0 python-engineio==4.8.0 --no-deps
```

### Issue 2: npm dependency conflict
**Problem:** `ecctrl` version conflict with `@react-three/fiber`
**Fix:** Already fixed in updated package.json. Install with `--legacy-peer-deps`

```powershell
cd C:\Users\rahul\Desktop\stubby\stub\frontend-3d
npm install --legacy-peer-deps
```

### Issue 3: Flask-SocketIO warning
**Problem:** `Flask-SocketIO not available`
**Fix:** Install just the SocketIO packages (Issue 1 fix above)

---

## Complete Installation (From Scratch)

### Step 1: Backend Dependencies
```powershell
cd C:\Users\rahul\Desktop\stubby\stub

# Activate venv (if not already active)
.\venv\Scripts\Activate.ps1

# Install only the SocketIO packages (skip psycopg2, it's already there)
pip install flask-socketio==5.3.6 python-socketio==5.10.0 python-engineio==4.8.0 --no-deps
```

### Step 2: Frontend Dependencies
```powershell
cd C:\Users\rahul\Desktop\stubby\stub\frontend-3d
npm install --legacy-peer-deps
```

### Step 3: Run Backend
```powershell
cd C:\Users\rahul\Desktop\stubby\stub
python dashboard.py
```

**Expected output:**
```
Starting Flask with SocketIO (WebSocket enabled for 3D Twin)
* Running on http://0.0.0.0:5000
```

### Step 4: Run Frontend (New Terminal)
```powershell
cd C:\Users\rahul\Desktop\stubby\stub\frontend-3d
npm run dev
```

**Expected output:**
```
VITE v5.x.x ready in Xms

➜  Local:   http://localhost:3000/
```

### Step 5: Open Browser
Navigate to: **http://localhost:3000**

---

## Quick Commands (After First Install)

### Using Batch Files (Easiest)
1. Double-click: `stub\START_BACKEND.bat`
2. Double-click: `stub\frontend-3d\START_FRONTEND.bat`

### Using PowerShell
**Terminal 1 (Backend):**
```powershell
cd C:\Users\rahul\Desktop\stubby\stub
.\venv\Scripts\Activate.ps1
python dashboard.py
```

**Terminal 2 (Frontend):**
```powershell
cd C:\Users\rahul\Desktop\stubby\stub\frontend-3d
npm run dev
```

---

## Controls (3D View)

| Key | Action |
|-----|--------|
| **W/A/S/D** | Move forward/left/backward/right |
| **Mouse** | Look around (after clicking) |
| **Space** | Jump |
| **Shift** | Sprint |
| **ESC** | Release mouse cursor |

---

## Testing the WebSocket Connection

After starting both servers, check:

1. **Backend logs** should show:
   ```
   3D Twin client connected
   3D Twin client subscribed to machines: ['A', 'B', 'C']
   ```

2. **Browser console** (F12) should show:
   ```
   [Socket] Connected to server
   [Socket] Subscribed to machines: ['A', 'B', 'C']
   ```

3. **3D View** should show:
   - Connection indicator (top-left) = GREEN "LIVE"
   - Three rigs spinning
   - Stats updating in real-time

---

## Troubleshooting

### Backend won't start
```powershell
# Check Python version
python --version  # Should be 3.10+

# Check if venv is activated
# Should see (venv) at start of prompt

# Reinstall SocketIO
pip install flask-socketio==5.3.6 python-socketio==5.10.0 python-engineio==4.8.0 --force-reinstall --no-deps
```

### Frontend won't start
```powershell
# Clear node_modules and reinstall
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json
npm install --legacy-peer-deps

# If still failing, try with force
npm install --legacy-peer-deps --force
```

### No data in 3D view
1. **Check Kafka producer is running:**
   ```powershell
   cd C:\Users\rahul\Desktop\stubby\stub
   python producer.py
   ```

2. **Check consumer is running:**
   ```powershell
   cd C:\Users\rahul\Desktop\stubby\stub
   python consumer.py
   ```

3. **Check backend logs** for telemetry updates

### WebSocket not connecting
1. Verify Flask shows: `Starting Flask with SocketIO`
2. Check browser console for errors
3. Ensure no firewall blocking port 5000
4. Try accessing: http://localhost:5000/api/stats

---

## Database Migration (Optional)

To add the 3D coordinates table:

```powershell
cd C:\Users\rahul\Desktop\stubby\stub

# Connect to your Neon database and run:
psql <your-connection-string> -f migrations/add_3d_coords.sql
```

Or using Neon console:
1. Go to https://console.neon.tech
2. Select your project: "Rig-Alpha"
3. Open SQL Editor
4. Paste contents of `migrations/add_3d_coords.sql`
5. Execute

---

## Next Steps

1. **Add 3D models:** Place `.glb` files in `frontend-3d/public/models/`
2. **Add HDRI:** Place `.hdr` files in `frontend-3d/public/hdri/`
3. **Customize colors:** Edit `tailwind.config.js`
4. **Adjust rig positions:** Modify `RIG_LAYOUT` in `FactoryScene.jsx`

---

## Project Structure

```
stubby/
├── stub/
│   ├── dashboard.py              # Flask + SocketIO backend ✓
│   ├── consumer.py               # Kafka consumer ✓
│   ├── producer.py               # Sensor simulator
│   ├── requirements.txt          # Python deps ✓
│   ├── START_BACKEND.bat         # Backend launcher ✓
│   │
│   ├── frontend-3d/              # React Three Fiber app ✓
│   │   ├── src/
│   │   │   ├── components/       # 3D components ✓
│   │   │   ├── store/            # Zustand state ✓
│   │   │   └── hooks/            # Socket.IO hook ✓
│   │   ├── package.json          # Updated dependencies ✓
│   │   ├── START_FRONTEND.bat    # Frontend launcher ✓
│   │   ├── INSTALL.bat           # Auto-installer ✓
│   │   └── README.md             # Documentation ✓
│   │
│   └── migrations/
│       └── add_3d_coords.sql     # 3D config table ✓
│
└── QUICKSTART.md                 # This file ✓
```

---

## Support

For issues, check:
1. Backend terminal for Flask errors
2. Frontend terminal for npm/build errors
3. Browser console (F12) for JavaScript errors
4. Database connection in backend logs

Happy building! 🚀
