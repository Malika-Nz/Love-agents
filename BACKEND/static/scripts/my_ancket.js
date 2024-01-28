const updateProfile = document.getElementById("updateProfile");

updateProfile.addEventListener("submit", async (e) => {
  e.preventDefault();

  fetch("/update", {
    method: "POST",
    body: new FormData(updateProfile),
  })
    .then((res) => {
      if (res.ok) {
        alert("Данные успешно обновлены!");
        window.location.reload();
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

const updatePassword = document.getElementById("updatePassword");

updatePassword.addEventListener("submit", async (e) => {
  e.preventDefault();

  if (
    updatePassword.new_password.value !== updatePassword.confirm_password.value
  ) {
    alert("Пароли не совпадают");
    return;
  }

  fetch("/update_password", {
    method: "POST",
    body: new FormData(updatePassword),
  })
    .then((res) => {
      if (res.ok) {
        alert("Пароль успешно обновлен!");
        window.location.reload();
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

function ArchivateAccount() {
  let confirm = window.confirm("Вы уверены, что хотите удалить аккаунт?");
  if (!confirm) {
    return;
  }

  let reason = window.prompt("Причина удаления аккаунта:");
  if (!reason) {
    alert("Причина удаления аккаунта не может быть пустой");
    return;
  }

  fetch("/archivate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json;charset=utf-8",
    },
    body: JSON.stringify({ reason }),
  })
    .then((res) => {
      if (res.ok) {
        alert("Аккаунт успешно удалён!");
        window.location.href = "/logout";
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
}

const payForm = document.getElementById("payForm");

if (payForm) {
  payForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    fetch("/pay", {
      method: "POST",
      body: new FormData(payForm),
    })
      .then((res) => {
        if (res.ok) {
          alert("Платёж успешно проведён!");
          const nextButton = document.getElementById("nextButton");
          nextButton.disabled = false;
          payForm.submit.disabled = true;
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
}

Array.from(document.getElementsByTagName("form")).forEach((form) => {
  if (form.id.includes("reviewForm")) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const status = e.target.elements["status[]"].value;
      const comment = e.target.elements.comment.value;
      const letter = +e.target.elements.letter.value;
      console.log(status, comment, letter);
      fetch(`/review`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json;charset=utf-8",
        },
        body: JSON.stringify({ status, comment, letter }),
      });
      window.location.reload();
    });
  }
});

document.addEventListener("click", (e) => {
  // кнопка "Открыть"
  if (e.target.id && e.target.id.includes("open")) {
    let id = e.target.id.split("_")[0];
    let readed = true;
    let type = e.target.dataset.type;

    fetch(`/update_letter`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json;charset=utf-8",
      },
      body: JSON.stringify({ id, readed, type }),
    })
      .then((res) => {
        if (res.ok) {
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
        alert("Сервер упал");
      });
  }

  // кнопка "Отказать"
  if (e.target.id && e.target.id.includes("refuce")) {
    let id = e.target.id.split("_")[0];
    let readed = false;
    let status = "R";

    fetch(`/update_letter`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json;charset=utf-8",
      },
      body: JSON.stringify({ id, status, readed }),
    })
      .then((res) => {
        if (res.ok) {
          window.location.reload();
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
        alert("Сервер упал");
      });
  }

  // кнопка "Согласиться" (после оплаты)
  if (e.target.id && e.target.id === "nextButton") {
    let status = "G";
    let readed = false;
    let id = e.target.dataset.id;

    fetch(`/update_letter`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json;charset=utf-8",
      },
      body: JSON.stringify({ id, status, readed }),
    })
      .then((res) => {
        if (res.ok) {
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
        alert("Сервер упал");
      });
  }

  // кнопка "Завершить"
  if (e.target.id && e.target.id.includes("close")) {
    window.location.reload();
  }
});
