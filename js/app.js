// Tienda Digital Colombia - V1
const WHATSAPP_NUMBER = "573106229876";

const DEFAULT_MESSAGE = "Hola, Tienda Digital Colombia. Quiero solicitar información sobre sus servicios.";

function openWhatsApp(message = DEFAULT_MESSAGE) {
  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
  window.open(url, "_blank", "noopener,noreferrer");
}

document.querySelectorAll("[data-whatsapp]").forEach(link => {
  link.addEventListener("click", event => {
    event.preventDefault();
    openWhatsApp();
  });
});

document.querySelectorAll("[data-service]").forEach(link => {
  link.addEventListener("click", event => {
    event.preventDefault();
    const service = link.dataset.service;
    openWhatsApp(`Hola, Tienda Digital Colombia. Estoy interesado(a) en el servicio de ${service}. Quisiera recibir información.`);
  });
});

const menuToggle = document.querySelector(".menu-toggle");
const mainNav = document.querySelector(".main-nav");

menuToggle?.addEventListener("click", () => {
  const isOpen = mainNav.classList.toggle("open");
  menuToggle.setAttribute("aria-expanded", String(isOpen));
});

document.querySelectorAll(".main-nav a").forEach(link => {
  link.addEventListener("click", () => mainNav.classList.remove("open"));
});

document.querySelector("#contact-form")?.addEventListener("submit", event => {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const nombre = form.get("nombre");
  const servicio = form.get("servicio");
  const mensaje = form.get("mensaje") || "Sin detalles adicionales.";

  const text = `Hola, Tienda Digital Colombia.%0A%0AMi nombre es ${nombre}.%0AEstoy interesado(a) en: ${servicio}.%0A%0ADetalles: ${mensaje}`;
  window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${text}`, "_blank", "noopener,noreferrer");
});

document.querySelector("#year").textContent = new Date().getFullYear();
