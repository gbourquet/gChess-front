# The JWT is kept in sessionStorage

The token is stored in `sessionStorage`, not `localStorage`, for security: it disappears when the tab is closed instead of lingering in the browser for its whole 24-hour validity, which narrows the window in which a stolen or forgotten token can be reused. The cost is accepted: closing the tab signs the User out, and every new tab asks them to sign in again.

Do not move it to `localStorage` for convenience without revisiting this decision.
