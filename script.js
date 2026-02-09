document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const userNameInput = document.getElementById('userName');
    const valentineNameInput = document.getElementById('valentineName');

    // New Document Elements
    const docUserName = document.getElementById('docUserName');
    const docValentineName = document.getElementById('docValentineName');
    const sigUserDisplay = document.getElementById('sigUserDisplay');
    const sigValentineDisplay = document.getElementById('sigValentineDisplay');

    const generateBtn = document.getElementById('generateBtn');
    const sendBtn = document.getElementById('sendBtn');
    const shareOptions = document.getElementById('shareOptions');
    const closeShareBtn = document.getElementById('closeShare');
    const agreementCard = document.getElementById('agreementCard');

    // State
    let generatedImageBlob = null;

    // Functions
    const updateAgreement = () => {
        const uName = userNameInput.value.trim() || "Your Name";
        const vName = valentineNameInput.value.trim() || "Their Name";

        // Update Document Text
        docUserName.textContent = uName;
        docValentineName.textContent = vName;

        // Update Signatures
        sigUserDisplay.textContent = uName;
        sigValentineDisplay.textContent = vName;
    };

    // Helper to convert images to Base64 to prevent tainted canvas
    const convertImagesToBase64 = async (container) => {
        const images = container.querySelectorAll('img');
        const promises = Array.from(images).map(async (img) => {
            if (img.src.startsWith('data:')) return; // Already base64

            try {
                const response = await fetch(img.src);
                const blob = await response.blob();
                return new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        img.src = reader.result;
                        resolve();
                    };
                    reader.readAsDataURL(blob);
                });
            } catch (e) {
                console.warn(`Failed to convert image ${img.src} to Base64. This might cause a SecurityError if not on a server.`, e);
            }
        });
        await Promise.all(promises);
    };

    const handleSend = async () => {
        // Show loading state if needed, or just process
        const originalBtnText = sendBtn.innerHTML;
        sendBtn.innerText = "Generating...";

        try {
            // Check if names are filled
            if (!userNameInput.value || !valentineNameInput.value) {
                alert("Please enter both names first!");
                sendBtn.innerHTML = originalBtnText;
                return;
            }

            // Update one last time just in case
            updateAgreement();

            // Pre-convert images to Base64 to avoid "Tainted Canvas" error
            await convertImagesToBase64(agreementCard);

            // Use html2canvas to capture the agreement card
            const canvas = await html2canvas(agreementCard, {
                scale: 2, // Better resolution
                backgroundColor: null, // Transparent background if not set
                useCORS: true, // Prevent tainted canvas when using external images
                logging: false
            });

            // Convert to blob/url
            const imageMap = canvas.toDataURL("image/png");

            // Convert canvas to Blob for sharing
            const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
            const file = new File([blob], `Love_Agreement_${userNameInput.value}.png`, { type: 'image/png' });

            // Show share options
            shareOptions.classList.remove('hidden');

            // Setup download button in the modal
            const downloadBtn = document.querySelector('.download-only');
            const downloadAction = () => {
                const link = document.createElement('a');
                link.download = `Love_Agreement_${userNameInput.value}_${valentineNameInput.value}.png`;
                link.href = imageMap;
                link.click();
            };
            downloadBtn.onclick = downloadAction;

            // Logic for sharing
            let isSharing = false;
            const shareContent = async () => {
                if (isSharing) return;
                isSharing = true;

                const shareData = {
                    title: 'Love Agreement',
                    text: `Check out this Love Agreement between ${userNameInput.value} and ${valentineNameInput.value}!`,
                    files: [file]
                };

                if (navigator.canShare && navigator.canShare(shareData)) {
                    try {
                        await navigator.share(shareData);
                    } catch (err) {
                        if (err.name !== 'AbortError') {
                            console.error('Sharing failed:', err);
                            downloadAction(); // Fallback to download
                        }
                    } finally {
                        isSharing = false;
                    }
                } else {
                    isSharing = false;
                    alert("Sharing not supported on this browser. Downloading instead.");
                    downloadAction();
                }
            };

            // Setup other 'share' buttons
            document.querySelector('.whatsapp').onclick = shareContent;
            document.querySelector('.instagram').onclick = shareContent;

        } catch (err) {
            console.error(err);
            alert("Something went wrong while generating the agreement image.");
        } finally {
            sendBtn.innerHTML = originalBtnText;
        }
    };

    // Event Listeners
    generateBtn.addEventListener('click', updateAgreement);
    sendBtn.addEventListener('click', handleSend);

    closeShareBtn.addEventListener('click', () => {
        shareOptions.classList.add('hidden');
    });

    // Optional: Update while typing?
    // userNameInput.addEventListener('input', updateAgreement);
    // valentineNameInput.addEventListener('input', updateAgreement);
});
