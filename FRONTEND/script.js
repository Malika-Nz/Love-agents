regForm = document.getElementById("registrationForm");

// regForm.addEventListener('submit',(e) =>{
//     e.preventDefault();

//     console.log(regForm)
// })
regForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    let response = await fetch('http://localhost:3333/signup', {
        method: 'POST',
        body: new FormData(regForm)
    });
    console.log(response);

    // const fio = regForm.fio.value;
    // const age = regForm.age.value;
    // const ava = regForm.formFile;
    // console.log(ava);
    // let response = await fetch('http://localhost:3333/signup', {
    //     method: 'POST',
    //     headers: {
    //         'Content-Type': 'application/json;charset=utf-8'
    //     },
    //     body: JSON.stringify({fio, age})
    // });
    // console.log(response);
})
