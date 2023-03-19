loginForm = document.getElementById("LoginForm");

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    try {
        const response = await fetch('/login', {
            method: 'POST',
            body: new FormData(loginForm)
        });

        if (response.ok) {
            window.location.href = '/cards';
            return;
        }

        const errorData = await response.json();
        alert(errorData.error);
    } catch (error) {
        console.error(error);
        alert('Ошибка запроса');
    }
});

const logoutButton = document.getElementById("logoutButton");

if (logoutButton) {
    logoutButton.addEventListener('click', async (e) => {
        e.preventDefault();
        console.log(1);

        try {
            const response = await fetch('/logout', {
                method: 'POST'
            });

            if (response.ok) {
                window.location.href = '/';
                return;
            }

            const errorData = await response.json();
            alert(errorData.error);
        } catch (error) {
            console.error(error);
            alert('Ошибка запроса');
        }
    });
}
