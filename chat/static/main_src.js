
    const chatDiv = document.getElementById("chat");
    const input = document.getElementById("msg");
    const imgInput = document.getElementById("imgInput");

    
    const sendMessageBtn = document.getElementById("sendMessageBtn");
    const requestImageBtn = document.getElementById("requestImageBtn");
    const nextChatBtn = document.getElementById("nextChatBtn");

    let typingP = null;
    let systemP = null;
    let typingClearTimeout = null;

    let myName = "";
    let strangerName = "Stranger";
    const socket_scheme = window.location.protocol === "https:" ? "wss" : "ws";
    
    const socket = new WebSocket(`${socket_scheme}://` + window.location.host + "/ws/chat/");

    
    function setChatControlsEnabled(enabled) {
      input.disabled = !enabled;
      sendMessageBtn.disabled = !enabled;
      requestImageBtn.disabled = !enabled;

    }

    
    socket.onopen = () => {
      
    };


    socket.onmessage = function (e) {
      const data = JSON.parse(e.data);

      if (data.type === "system") {
        
        showSystemMessage(data.message);
         if (data.message.toLowerCase().includes("disconnected")) {
          clearChat();
          showSystemMessage(`${data.name} has Disconnected.`);
      
      showNamePrompt();
      setChatControlsEnabled(false); 
}
      } else if (data.type === "chat") {
        
        removeTyping();
        removeSystem(); 
        const sender = data.name || strangerName; 
        addMessage(`${sender}: ${data.message}`); 
      } else if (data.type === "typing") {
        
        showTyping(data.name || strangerName);
      } else if (data.type === "image") {
        
        showImage(data.data, strangerName);
      } else if (data.type === "image_request") {
        
        showImageRequestPrompt();
      } else if (data.type === "partner_name") {
        
        strangerName = data.name || "Stranger";
        setChatControlsEnabled(true); 
      }
    };

    
    socket.onclose = function (e) {
      const data = JSON.parse(e.data); 
      showSystemMessage(`${data.name} has Disconnected.`);
      clearChat(); 
      showNamePrompt(); 
      setChatControlsEnabled(false); 
    };

    
    function sendMessage() {
      
      if (input.disabled) return;

      const message = input.value.trim();
      if (message) {
        
        socket.send(JSON.stringify({ type: "chat", message, name: myName }));
        addMessage(`${myName}: ${message}`); 
        input.value = ""; 
        removeTyping(); 
        removeSystem(); 
      }
    }

    
    function addMessage(text, cls = "") {
      const p = document.createElement("p");
      p.textContent = text;
      if (cls) p.classList.add(cls);
      chatDiv.appendChild(p);
      chatDiv.scrollTop = chatDiv.scrollHeight; 
    }

    
    function showTyping(name) {
      removeTyping(); 
      typingP = document.createElement("p");
      typingP.classList.add("typing");
      typingP.textContent = `${name} is typing...`;
      chatDiv.appendChild(typingP);
      chatDiv.scrollTop = chatDiv.scrollHeight;

      
      clearTimeout(typingClearTimeout);
      typingClearTimeout = setTimeout(removeTyping, 4000);
    }

    
    function removeTyping() {
      if (typingP && typingP.parentNode) {
        typingP.parentNode.removeChild(typingP);
        typingP = null;
      }
      clearTimeout(typingClearTimeout);
    }

    
    function showSystemMessage(text) {
      removeSystem(); 
      const p = document.createElement("p");
      p.classList.add("system");
      p.textContent = text;
      chatDiv.appendChild(p);
      chatDiv.scrollTop = chatDiv.scrollHeight;

      if (!text.includes("Connected to")) {
        systemP = p;
      }
    }

    
    function removeSystem() {
      if (systemP && systemP.parentNode) {
        systemP.parentNode.removeChild(systemP);
        systemP = null;
      }
    }

    
    function requestImage() {
      
      if (requestImageBtn.disabled) return;

      socket.send(JSON.stringify({ type: "image_request" }));
      showSystemMessage("You requested an image.");
    }

    
    function showImageRequestPrompt() {
      removeTyping();
      removeSystem();

      const p = document.createElement("p");
      p.classList.add("system");
      p.innerHTML = `${strangerName} is requesting an image... <button onclick="document.getElementById('imgInput').click()">Upload Image</button>`;
      chatDiv.appendChild(p);
      chatDiv.scrollTop = chatDiv.scrollHeight;

      systemP = p; 
    }

    
    imgInput.addEventListener("change", function () {
      const file = imgInput.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = function (e) {
        const imageData = e.target.result; 
        socket.send(JSON.stringify({ type: "image", data: imageData })); 
        showImage(imageData, myName); 
        removeSystem(); 
      };
      reader.readAsDataURL(file); 
    });

    
    function showImage(dataURL, sender = "Stranger") {
      removeTyping();
      removeSystem();

      const p = document.createElement("p");
      const label = document.createElement("span");
      label.textContent = sender + ":";
      label.style.display = "block";

      const img = document.createElement("img");
      img.src = dataURL;

      p.appendChild(label);
      p.appendChild(img);
      chatDiv.appendChild(p);
      chatDiv.scrollTop = chatDiv.scrollHeight;
    }

    
    input.addEventListener("input", () => {
      
      if (!input.disabled) {
        socket.send(JSON.stringify({ type: "typing", name: myName }));
      }
    });

    
    input.addEventListener("keypress", (e) => {
      if (e.key === "Enter") sendMessage();
    });

    
    function nextChat() {
      socket.send(JSON.stringify({ type: "next" })); 
      clearChat(); 

      setChatControlsEnabled(false);
      showNamePrompt(); 
    }

    function clearChat() {
      chatDiv.innerHTML = "";
      removeTyping();
      removeSystem();
    }

  
    function submitNameInline() {
      const inlineNameInput = document.getElementById("inlineNameInput");
      const inputName = inlineNameInput.value.trim();
      if (!inputName) {
        alert("Please enter a name");
        return;
      }
      myName = inputName; 

      
      const namePrompt = document.getElementById("namePrompt");
      if (namePrompt) {
        namePrompt.remove();
      }

      
      socket.send(JSON.stringify({
        type: "set_name",
        name: myName
      }));

      
      socket.send(JSON.stringify({
        type: "ready"
      }));

      
      showSystemMessage("Waiting for a stranger...");
      
      setChatControlsEnabled(false);
    }

    
    function showNamePrompt() {
      
      if (document.getElementById("namePrompt")) {
          return;
      }

      const wrapper = document.createElement("div");
      wrapper.id = "namePrompt";
      wrapper.classList.add("system");
      wrapper.innerHTML = `
        <label>Enter your name: <input type="text" id="inlineNameInput" placeholder="Your name" value="${myName || ''}">
        <button onclick="submitNameInline()">Start Chat</button></label>
      `;
      chatDiv.appendChild(wrapper);
      chatDiv.scrollTop = chatDiv.scrollHeight; 

      
      const inlineNameInput = document.getElementById("inlineNameInput");
      if (inlineNameInput) {
        inlineNameInput.value = myName || '';
      }
    }

    
    showNamePrompt();
    setChatControlsEnabled(false); 

    function reportChat() {
        socket.send(JSON.stringify({
        type: "reported"}));
                }
  
document.addEventListener("DOMContentLoaded", function () {
  const privacyModal = document.getElementById("privacyModal");
  const openPrivacyBtn = document.getElementById("openPrivacyPolicy");
  const closePrivacyBtn = document.querySelector("#privacyModal .close-button");

  const termsModal = document.getElementById("termsModal");
  const openTermsBtn = document.getElementById("openTerms");
  const closeTermsBtn = document.getElementById("closeTerms");

  // Helper to open privacy modal
  function openPrivacy() {
    termsModal.style.display = "none";
    privacyModal.style.display = "block";
  }

  // Open Privacy Policy from anywhere
  openPrivacyBtn.addEventListener("click", function (e) {
    e.preventDefault();
    openPrivacy();
  });

  // ALSO catch privacy policy clicks INSIDE the terms modal
  document.querySelectorAll(".privacy-link").forEach(link => {
    link.addEventListener("click", function (e) {
      e.preventDefault();
      openPrivacy();
    });
  });
  // Open Contact Modal from anywhere (Terms or Privacy)
document.querySelectorAll(".contact-link").forEach(link => {
  link.addEventListener("click", function (e) {
    e.preventDefault();
    privacyModal.style.display = "none";
    termsModal.style.display = "none";
    contactModal.style.display = "block";
  });
});


  // Close Privacy Policy
  closePrivacyBtn.onclick = function () {
    privacyModal.style.display = "none";
  };

  // Open Terms of Use
  openTermsBtn.onclick = function (e) {
    e.preventDefault();
    privacyModal.style.display = "none";
    termsModal.style.display = "block";
  };

  // Close Terms of Use
  closeTermsBtn.onclick = function () {
    termsModal.style.display = "none";
  };

  // Close any modal when clicking outside
  window.onclick = function (event) {
    if (event.target === privacyModal) {
      privacyModal.style.display = "none";
    }
    if (event.target === termsModal) {
      termsModal.style.display = "none";
    }
  };
});


const contactModal = document.getElementById("contactModal");
const openContactBtn = document.getElementById("openContact");
const closeContactBtn = document.getElementById("closeContact");

openContactBtn.onclick = function (e) {
  e.preventDefault();
  privacyModal.style.display = "none";
  termsModal.style.display = "none";
  contactModal.style.display = "block";
};

closeContactBtn.onclick = function () {
  contactModal.style.display = "none";
};

window.onclick = function (event) {
  if (event.target === privacyModal) privacyModal.style.display = "none";
  if (event.target === termsModal) termsModal.style.display = "none";
  if (event.target === contactModal) contactModal.style.display = "none";
};

const contactForm = document.getElementById("contactForm");
const contactSuccess = document.getElementById("contactSuccess");

if (contactForm) {
  contactForm.addEventListener("submit", function (e) {
    e.preventDefault();
    const formData = new FormData(contactForm);
    const url = contactForm.dataset.url;

    fetch(url, {
      method: "POST",
      headers: {
        "X-CSRFToken": formData.get("csrfmiddlewaretoken")
      },
      body: formData
    })
    .then(res => {
      if (res.ok) {
        contactForm.reset();
        contactSuccess.style.display = "block";
        setTimeout(() => {
          contactSuccess.style.display = "none";
          contactModal.style.display = "none";
        }, 2500);
      } else {
        alert("Something went wrong. Please try again.");
      }
    });
  });
}
