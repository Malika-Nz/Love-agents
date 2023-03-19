regForm = document.getElementById("registrationForm");

regForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    console.log(regForm);
    console.log(new FormData(regForm));

    fetch('http://localhost:3333/signup', {
        method: 'POST',
        body: new FormData(regForm)
    }).then(res => {
        if (res.status === 201) {
            window.location.href = 'cards';
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
})
