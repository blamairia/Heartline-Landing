/**
 * Run this in browser console to get your session token
 */
console.log('Your session cookies:')
document.cookie.split(';').forEach(cookie => {
  const [name, value] = cookie.trim().split('=')
  if (name.includes('session') || name.includes('auth')) {
    console.log(`${name}: ${value}`)
  }
})