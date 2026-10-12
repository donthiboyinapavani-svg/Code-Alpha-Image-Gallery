/* =====================================================
   VISIONGALLERY - JAVASCRIPT
===================================================== */


/* =====================================================
   GET HTML ELEMENTS
===================================================== */

const searchInput =
    document.getElementById("searchInput");

const searchBtn =
    document.getElementById("searchBtn");

const gallery =
    document.getElementById("gallery");

const loading =
    document.getElementById("loading");

const message =
    document.getElementById("message");

const resultTitle =
    document.getElementById("resultTitle");

const imageCount =
    document.getElementById("imageCount");

const lightbox =
    document.getElementById("lightbox");

const lightboxImage =
    document.getElementById("lightboxImage");

const closeBtn =
    document.getElementById("closeBtn");

const prevBtn =
    document.getElementById("prevBtn");

const nextBtn =
    document.getElementById("nextBtn");

const voiceSearchBtn =
    document.getElementById("voiceSearchBtn");

const voiceButtonText =
    document.getElementById("voiceButtonText");

const voiceResult =
    document.getElementById("voiceResult");

const spokenText =
    document.getElementById("spokenText");


/* =====================================================
   VARIABLES
===================================================== */

let images = [];

let currentIndex = 0;

let recognition = null;


/* =====================================================
   AI WELCOME VOICE
===================================================== */

function speakWelcome() {

    const text =
        "Hello everyone! Welcome to VisionGallery. " +
        "I am your AI Image Assistant. " +
        "You can type or speak anything you want to search. " +
        "Let's explore the world of images together.";


    if ("speechSynthesis" in window) {

        window.speechSynthesis.cancel();

        const speech =
            new SpeechSynthesisUtterance(text);

        speech.rate = 0.95;

        speech.pitch = 1.05;

        speech.volume = 1;

        window.speechSynthesis.speak(speech);

    }

}


/* =====================================================
   VOICE SEARCH
===================================================== */

const SpeechRecognition =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;


function startVoiceSearch() {

    if (!SpeechRecognition) {

        alert(
            "Voice search is not supported in this browser. " +
            "Please use Google Chrome or Microsoft Edge."
        );

        return;

    }


    recognition =
        new SpeechRecognition();


    /* Indian English */

    recognition.lang =
        "en-IN";


    recognition.continuous =
        false;


    recognition.interimResults =
        false;


    recognition.maxAlternatives =
        1;


    /* Start microphone */

    recognition.start();


    voiceSearchBtn.classList.add(
        "listening"
    );


    voiceButtonText.textContent =
        "Listening...";


    voiceResult.classList.add(
        "show"
    );


    spokenText.textContent =
        "Listening...";


    /* Speech received */

    recognition.onresult =
        function(event) {

            const text =
                event
                    .results[0][0]
                    .transcript
                    .trim();


            /* Put speech into search box */

            searchInput.value =
                text;


            /* Show what user said */

            spokenText.textContent =
                text;


            /* Automatically search */

            if (text) {

                searchImages(text);

            }

        };


    /* Microphone stopped */

    recognition.onend =
        function() {

            voiceSearchBtn.classList.remove(
                "listening"
            );

            voiceButtonText.textContent =
                "Speak";

        };


    /* Error handling */

    recognition.onerror =
        function(event) {

            voiceSearchBtn.classList.remove(
                "listening"
            );

            voiceButtonText.textContent =
                "Speak";


            if (
                event.error ===
                "not-allowed"
            ) {

                alert(
                    "Microphone permission was denied. " +
                    "Please allow microphone access."
                );

            }

            else if (
                event.error ===
                "no-speech"
            ) {

                spokenText.textContent =
                    "No speech detected. Please try again.";

            }

            else {

                spokenText.textContent =
                    "Voice search error. Please try again.";

            }

        };

}


/* =====================================================
   WIKIPEDIA SEARCH
===================================================== */

async function searchWikipedia(query) {

    const url =
        "https://en.wikipedia.org/w/rest.php/v1/search/page?q=" +
        encodeURIComponent(query) +
        "&limit=20";


    try {

        const response =
            await fetch(url);


        if (!response.ok) {

            return [];

        }


        const data =
            await response.json();


        return data.pages || [];

    }

    catch (error) {

        console.log(
            "Wikipedia error:",
            error
        );

        return [];

    }

}


/* =====================================================
   WIKIMEDIA COMMONS SEARCH
===================================================== */

async function searchCommons(query) {

    const url =
        "https://commons.wikimedia.org/w/api.php?" +
        "action=query" +
        "&generator=search" +
        "&gsrsearch=" +
        encodeURIComponent(query) +
        "&gsrnamespace=6" +
        "&gsrlimit=50" +
        "&gsrwhat=text" +
        "&prop=imageinfo" +
        "&iiprop=url" +
        "&iiurlwidth=1000" +
        "&format=json" +
        "&formatversion=2" +
        "&origin=*";


    try {

        const response =
            await fetch(url);


        if (!response.ok) {

            return [];

        }


        const data =
            await response.json();


        return data.query?.pages || [];

    }

    catch (error) {

        console.log(
            "Commons error:",
            error
        );

        return [];

    }

}


/* =====================================================
   CALCULATE IMAGE RELEVANCE
===================================================== */

function getRelevance(
    title,
    query
) {

    const text =
        title.toLowerCase();

    let score = 0;


    /* Exact match */

    if (
        text === query
    ) {

        score += 100;

    }


    /* Starts with search */

    if (
        text.startsWith(query)
    ) {

        score += 60;

    }


    /* Contains complete search */

    if (
        text.includes(query)
    ) {

        score += 40;

    }


    /* Individual words */

    const words =
        query.split(/\s+/);


    words.forEach(
        word => {

            if (
                word.length > 2 &&
                text.includes(word)
            ) {

                score += 15;

            }

        }
    );


    return score;

}


/* =====================================================
   SEARCH IMAGES
===================================================== */

async function searchImages(query) {

    if (!query) {

        return;

    }


    /* Clear previous images */

    gallery.innerHTML =
        "";


    message.style.display =
        "none";


    /* Show loading */

    loading.style.display =
        "block";


    resultTitle.textContent =
        `Images for "${query}"`;


    imageCount.textContent =
        "Searching...";


    try {

        /*
           Search Wikipedia and Commons
           at the same time
        */

        const [
            wikiResults,
            commonsResults
        ] =
            await Promise.all([

                searchWikipedia(query),

                searchCommons(query)

            ]);


        let results = [];


        const normalizedQuery =
            query.toLowerCase().trim();


        /* =================================================
           WIKIPEDIA RESULTS
        ================================================= */

        wikiResults.forEach(
            page => {

                if (
                    page.thumbnail &&
                    page.thumbnail.url
                ) {

                    results.push({

                        title:
                            page.title,

                        image:
                            page.thumbnail.url,

                        source:
                            "Wikipedia",

                        relevance:
                            getRelevance(
                                page.title,
                                normalizedQuery
                            )

                    });

                }

            }
        );


        /* =================================================
           COMMONS RESULTS
        ================================================= */

        commonsResults.forEach(
            page => {

                if (
                    page.imageinfo &&
                    page.imageinfo[0]
                ) {

                    const info =
                        page.imageinfo[0];


                    if (
                        !info.thumburl &&
                        !info.url
                    ) {

                        return;

                    }


                    const title =
                        page.title
                            .replace(
                                "File:",
                                ""
                            )
                            .replace(
                                /\.[^/.]+$/,
                                ""
                            );


                    results.push({

                        title:
                            title,

                        image:
                            info.thumburl ||
                            info.url,

                        source:
                            "Wikimedia Commons",

                        relevance:
                            getRelevance(
                                title,
                                normalizedQuery
                            )

                    });

                }

            }
        );


        /* =================================================
           REMOVE DUPLICATE IMAGES
        ================================================= */

        const unique =
            new Map();


        results.forEach(
            item => {

                if (
                    item.image &&
                    !unique.has(
                        item.image
                    )
                ) {

                    unique.set(
                        item.image,
                        item
                    );

                }

            }
        );


        results =
            Array.from(
                unique.values()
            );


        /* =================================================
           SORT BY RELEVANCE
        ================================================= */

        results.sort(
            (a, b) =>
                b.relevance -
                a.relevance
        );


        /* =================================================
           ONLY RELEVANT IMAGES
        ================================================= */

        const relevant =
            results.filter(
                item =>
                    item.relevance > 0
            );


        /*
           Maximum 50 images
        */

        images =
            relevant.slice(
                0,
                50
            );


        /* Stop loading */

        loading.style.display =
            "none";


        /* =================================================
           NO RESULTS
        ================================================= */

        if (
            images.length === 0
        ) {

            imageCount.textContent =
                "0 images";


            message.innerHTML = `

                <h3>
                    😕 No relevant images found
                </h3>

                <p style="margin-top:8px;">
                    Try another search word
                    or use voice search.
                </p>

            `;


            message.style.display =
                "block";


            return;

        }


        /* Show count */

        imageCount.textContent =
            `${images.length} images`;


        /* Display images */

        displayImages();

    }

    catch (error) {

        console.error(error);


        loading.style.display =
            "none";


        message.innerHTML = `

            <h3>
                ⚠️ Something went wrong
            </h3>

            <p style="margin-top:8px;">
                Please try searching again.
            </p>

        `;


        message.style.display =
            "block";

    }

}


/* =====================================================
   DISPLAY IMAGES
===================================================== */

function displayImages() {

    gallery.innerHTML =
        "";


    images.forEach(
        (item, index) => {

            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "image-card";


            card.style.animationDelay =
                `${index * 0.03}s`;


            card.innerHTML = `

                <img
                    src="${item.image}"
                    alt="${escapeHTML(item.title)}"
                    loading="lazy"
                    onerror="
                        this.parentElement.style.display='none'
                    "
                >

                <div class="image-overlay">

                    <h3>
                        ${escapeHTML(item.title)}
                    </h3>

                    <small>
                        ${item.source}
                    </small>

                </div>

            `;


            /*
               Open lightbox
               when image is clicked
            */

            card.addEventListener(
                "click",
                function() {

                    openLightbox(index);

                }
            );


            gallery.appendChild(
                card
            );

        }
    );

}


/* =====================================================
   PROTECT HTML
===================================================== */

function escapeHTML(text) {

    const div =
        document.createElement(
            "div"
        );


    div.textContent =
        text;


    return div.innerHTML;

}


/* =====================================================
   LIGHTBOX
===================================================== */

function openLightbox(index) {

    currentIndex =
        index;


    lightboxImage.src =
        images[
            currentIndex
        ].image;


    lightbox.style.display =
        "flex";

}


function closeLightbox() {

    lightbox.style.display =
        "none";

}


/* =====================================================
   PREVIOUS IMAGE
===================================================== */

function showPrevious() {

    if (
        images.length === 0
    ) {

        return;

    }


    currentIndex--;


    if (
        currentIndex < 0
    ) {

        currentIndex =
            images.length - 1;

    }


    lightboxImage.src =
        images[
            currentIndex
        ].image;

}


/* =====================================================
   NEXT IMAGE
===================================================== */

function showNext() {

    if (
        images.length === 0
    ) {

        return;

    }


    currentIndex++;


    if (
        currentIndex >=
        images.length
    ) {

        currentIndex = 0;

    }


    lightboxImage.src =
        images[
            currentIndex
        ].image;

}


/* =====================================================
   SEARCH BUTTON
===================================================== */

searchBtn.addEventListener(
    "click",
    function() {

        const query =
            searchInput.value.trim();


        if (query) {

            searchImages(
                query
            );

        }

    }
);


/* =====================================================
   ENTER KEY SEARCH
===================================================== */

searchInput.addEventListener(
    "keydown",
    function(event) {

        if (
            event.key ===
            "Enter"
        ) {

            const query =
                searchInput.value.trim();


            if (query) {

                searchImages(
                    query
                );

            }

        }

    }
);


/* =====================================================
   QUICK SEARCH BUTTONS
===================================================== */

document
    .querySelectorAll(
        ".quick-btn"
    )
    .forEach(
        button => {

            button.addEventListener(
                "click",
                function() {

                    /*
                       Remove emoji from button
                    */

                    const query =
                        button.textContent
                            .replace(
                                /^[^\w]+/u,
                                ""
                            )
                            .trim();


                    searchInput.value =
                        query;


                    searchImages(
                        query
                    );

                }
            );

        }
    );


/* =====================================================
   LIGHTBOX EVENTS
===================================================== */

closeBtn.addEventListener(
    "click",
    closeLightbox
);


prevBtn.addEventListener(
    "click",
    showPrevious
);


nextBtn.addEventListener(
    "click",
    showNext
);


/*
   Close lightbox by clicking
   outside the image
*/

lightbox.addEventListener(
    "click",
    function(event) {

        if (
            event.target ===
            lightbox
        ) {

            closeLightbox();

        }

    }
);


/* =====================================================
   KEYBOARD NAVIGATION
===================================================== */

document.addEventListener(
    "keydown",
    function(event) {

        if (
            lightbox.style.display ===
            "flex"
        ) {

            /*
               Escape
            */

            if (
                event.key ===
                "Escape"
            ) {

                closeLightbox();

            }


            /*
               Left arrow
            */

            if (
                event.key ===
                "ArrowLeft"
            ) {

                showPrevious();

            }


            /*
               Right arrow
            */

            if (
                event.key ===
                "ArrowRight"
            ) {

                showNext();

            }

        }

    }
);


/* =====================================================
   AI FLOATING BUTTON
===================================================== */

function toggleAI() {

    const aiMessage =
        document.getElementById(
            "aiMessage"
        );


    if (
        aiMessage.style.display ===
        "block"
    ) {

        aiMessage.style.display =
            "none";

    }

    else {

        aiMessage.style.display =
            "block";

    }

}


/* =====================================================
   CREATE BACKGROUND PARTICLES
===================================================== */

function createParticles() {

    for (
        let i = 0;
        i < 30;
        i++
    ) {

        const particle =
            document.createElement(
                "div"
            );


        particle.className =
            "particle";


        particle.style.left =
            Math.random() * 100 +
            "%";


        particle.style.animationDuration =
            8 +
            Math.random() * 12 +
            "s";


        particle.style.animationDelay =
            Math.random() * 8 +
            "s";


        document.body.appendChild(
            particle
        );

    }

}


/* =====================================================
   START PROJECT
===================================================== */

createParticles();


/*
   Load Nature images
   when website opens
*/

searchImages(
    "Nature"
);