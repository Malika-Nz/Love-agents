regForm = document.getElementById("registrationForm");

regForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    let response = await fetch('http://localhost:3333/signup', {
        method: 'POST',
        body: new FormData(regForm)
    });
})
