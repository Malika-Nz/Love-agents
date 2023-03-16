loginForm = document.getElementById("LoginForm");

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    console.log(new FormData(loginForm));

    let body;
    fetch('http://localhost:3333/login', {
        method: 'POST',
        body: new FormData(loginForm)
    }).then(res => {
        if (res.status === 200) {
            window.location.href = '/';
            return;
        }
        return res.json();
    }).then(res => {
        alert(res.error);
    })
})
