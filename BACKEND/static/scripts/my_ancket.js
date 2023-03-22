const updateProfile = document.getElementById('updateProfile');

updateProfile.addEventListener('submit', async (e) => {
    e.preventDefault();

    fetch('http://localhost:3333/update', {
        method: 'POST',
        body: new FormData(updateProfile)
    }).then(res => {
        if (res.ok) {
            alert('Данные успешно обновлены!');
            window.location.reload();
            return;
        }
        return res.json();
    }).then(data => {
        if (data) {
            alert(data.error);
        }
    }).catch(err => {
        console.error(err);
        alert('Ошибка запроса');
    })
});

const updatePassword = document.getElementById('updatePassword');

updatePassword.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    if (updatePassword.new_password.value !== updatePassword.confirm_password.value) {
        alert('Пароли не совпадают');
        return;
    }

    fetch('http://localhost:3333/update_password', {
        method: 'POST',
        body: new FormData(updatePassword)
    }).then(res => {
        if (res.ok) {
            alert('Пароль успешно обновлен!');
            window.location.reload();
            return;
        }
        return res.json();
    }).then(data => {
        if (data) {
            alert(data.error);
        }
    }).catch(err => {
        console.error(err);
        alert('Ошибка запроса');
    })
});