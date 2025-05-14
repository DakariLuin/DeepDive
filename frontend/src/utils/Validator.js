export function validateUsername(username) {
    const regex = /^[A-Za-z0-9_-]{3,30}$/;
    return regex.test(username);
}

export function validatePassword(password) {
    const regex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d$#%&*]{8,64}$/;
    return regex.test(password);
}