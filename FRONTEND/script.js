regForm = document.getElementById("registrationForm");

regForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  let response = await fetch("/signup", {
    method: "POST",
    body: new FormData(regForm),
  });
});
