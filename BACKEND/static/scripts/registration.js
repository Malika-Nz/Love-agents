regForm = document.getElementById("registrationForm");

oneWarningExists = false;

regForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  if (
    +regForm.birthday.value.split("-")[0] == new Date().getFullYear() - 18 &&
    +regForm.birthday.value.split("-")[1] > new Date().getMonth() + 1
  ) {
    error.innerText = "Вам должно быть больше 18 лет";
    return;
  } else if (
    +regForm.birthday.value.split("-")[0] >
    new Date().getFullYear() - 18
  ) {
    error.innerText = "Вам должно быть больше 18 лет";
    return;
  } else if (
    +regForm.birthday.value.split("-")[0] <
    new Date().getFullYear() - 80
  ) {
    error.innerText = "Вам должно быть меньше 80 лет";
    return;
  }

  if (
    regForm["gender[]"].value == regForm["gender_cand[]"].value &&
    !oneWarningExists
  ) {
    error.innerText =
      "Рекомендуем выбрать пол противоположный вашему.\nНажмите на кнопку еще раз, чтобы продолжить.";
    oneWarningExists = true;
    return;
  }

  error.innerText = "";

  fetch("/signup", {
    method: "POST",
    body: new FormData(regForm),
  })
    .then((res) => {
      if (res.ok) {
        window.location.href = "cards";
        return;
      }
      return res.json();
    })
    .then((data) => {
      if (data) {
        alert(data.error);
      }
    })
    .catch((err) => {
      console.error(err);
      alert("Ошибка запроса");
    });
});
