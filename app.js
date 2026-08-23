(() => {
  const config = window.BUILDATHON_CONFIG || {};
  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();

  const slides = [...document.querySelectorAll(".hero-slide")];
  const captionLabel = document.querySelector(".caption-label");
  const captionTitle = document.querySelector(".caption-title");
  const progress = document.querySelector(".rotation-progress span");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const meta = [
    { label: "START HERE", title: "Original photo", hold: 3000 },
    { label: "AI VERSION 1 OF 5", title: "Polished headshot", hold: 2400 },
    { label: "AI VERSION 2 OF 5", title: "Brand portrait", hold: 2400 },
    { label: "AI VERSION 3 OF 5", title: "Full-length look", hold: 2400 },
    { label: "AI VERSION 4 OF 5", title: "Editorial workspace", hold: 2400 },
    { label: "AI VERSION 5 OF 5", title: "Executive portrait", hold: 2400 }
  ];

  let current = 0;

  function setProgress(duration) {
    if (!progress) return;
    progress.classList.remove("animate");
    progress.style.animationDuration = `${duration}ms`;
    void progress.offsetWidth;
    progress.classList.add("animate");
  }

  function showSlide(index) {
    slides.forEach((slide, i) => slide.classList.toggle("is-active", i === index));
    if (captionLabel) captionLabel.textContent = meta[index].label;
    if (captionTitle) captionTitle.textContent = meta[index].title;
    setProgress(meta[index].hold);
  }

  function scheduleNext() {
    window.setTimeout(() => {
      current = (current + 1) % slides.length;
      showSlide(current);
      scheduleNext();
    }, meta[current].hold);
  }

  if (slides.length) {
    showSlide(0);
    if (!reduceMotion) scheduleNext();
  }

  const form = document.getElementById("registration-form");
  const errorBox = document.getElementById("form-error");

  function setError(message) {
    if (!errorBox) return;
    errorBox.textContent = message;
    errorBox.hidden = !message;
  }

  function setSubmitting(active) {
    const button = form?.querySelector('button[type="submit"]');
    if (!button) return;
    button.disabled = active;
    button.textContent = active ? "Saving your seat..." : "Save My Free Seat";
  }

  function showSuccess() {
    window.location.href = config.thankYouPath || "thank-you.html";
  }

  if (form) {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      setError("");

      if (!form.reportValidity()) return;

      const data = new FormData(form);
      const payload = {
        firstName: String(data.get("firstName") || "").trim(),
        email: String(data.get("email") || "").trim(),
        businessName: String(data.get("businessName") || "").trim(),
        source: "xc-ai-buildathon"
      };

      const localPreview =
        ["localhost", "127.0.0.1"].includes(location.hostname) ||
        location.protocol === "file:";

      if (!config.registrationEndpoint) {
        if (localPreview) {
          showSuccess();
          return;
        }
        setError("Registration is not connected yet. Add your Supabase function URL in config.js before publishing.");
        return;
      }

      setSubmitting(true);

      try {
        const response = await fetch(config.registrationEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        let result = {};
        try {
          result = await response.json();
        } catch (_) {}

        if (!response.ok) {
          throw new Error(result.error || "We could not save your registration. Please try again.");
        }

        showSuccess();
      } catch (error) {
        setError(error.message || "We could not save your registration. Please try again.");
      } finally {
        setSubmitting(false);
      }
    });
  }
})();
