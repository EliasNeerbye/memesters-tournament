function getCookieValue(cookies, name) {
    const match = cookies && cookies.match(new RegExp(`(^|;\\s*)${name}=([^;]*)`));
    return match ? decodeURIComponent(match[2]) : null;
}

module.exports = { getCookieValue };
