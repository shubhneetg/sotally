# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e3]:
    - link "Sotally" [ref=e5] [cursor=pointer]:
      - /url: /
    - generic [ref=e7]:
      - generic [ref=e8]:
        - heading "Welcome back" [level=1] [ref=e9]
        - paragraph [ref=e10]: Sign in to access your tools and credits
      - button "Continue with Google" [ref=e11] [cursor=pointer]:
        - img [ref=e12]
        - text: Continue with Google
      - generic [ref=e21]: Or continue with
      - generic [ref=e22]: Invalid email or password
      - generic [ref=e23]:
        - generic [ref=e24]:
          - generic [ref=e25]: Email
          - textbox "Email" [ref=e26]:
            - /placeholder: you@example.com
            - text: test-1773731418481-3egcx@sotally-test.invalid
        - generic [ref=e27]:
          - generic [ref=e28]: Password
          - textbox "Password" [ref=e29]:
            - /placeholder: Enter your password
            - text: TestPass123!Secure
        - button "Sign In" [ref=e30] [cursor=pointer]
      - paragraph [ref=e31]:
        - text: Don't have an account?
        - link "Sign up" [ref=e32] [cursor=pointer]:
          - /url: /register
  - alert [ref=e33]
```