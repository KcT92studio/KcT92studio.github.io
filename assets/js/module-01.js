document.getElementById("contact-form").addEventListener("submit", async function (event) {
        event.preventDefault();
        const btn = this.querySelector('button[type="submit"]');
        const statusEl = document.getElementById("form-status");
        const name = this.querySelector('[name="name"]').value.trim();
        const contact = this.querySelector('[name="contact"]').value.trim();
        const message = this.querySelector('[name="message"]').value.trim();

        btn.disabled = true;
        statusEl.textContent = "⏳ ກຳລັງສົ່ງ...";

        try {
          const res = await fetch(APPS_SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify({ action: 'submitContact', name, contact, message })
          });
          const data = await res.json();
          if (data && data.error) {
            statusEl.textContent = "❌ ຜິດພາດ: " + data.error;
          } else {
            statusEl.textContent = "✅ ຂອບໃຈ! ຂໍ້ຄວາມຂອງທ່ານຖືກສົ່ງແລ້ວ.";
            this.reset();
          }
        } catch (err) {
          statusEl.textContent = "❌ ເຊື່ອມຕໍ່ບໍ່ໄດ້ ລອງໃໝ່ພາຍຫຼັງ";
        } finally {
          btn.disabled = false;
        }
      });
