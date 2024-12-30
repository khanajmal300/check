# How to Push Code to GitHub

Here's how to push your code to GitHub:

1. Initialize Git (if not already done):
```bash
git init
```

2. Add your files to staging:
```bash
git add .
```

3. Commit your changes:
```bash
git commit -m "Your commit message"
```

4. Add GitHub remote (if not already done):
```bash
git remote add origin <your-github-repository-url>
```

5. Push your code:
```bash
git push -u origin main
```

Note: If you're using a different branch name (like 'master'), replace 'main' with your branch name.

Common issues:
- Make sure you have Git installed
- Ensure you have the correct repository URL
- Verify you have the proper permissions
- Check that you're authenticated with GitHub
