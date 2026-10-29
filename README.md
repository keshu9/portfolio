# Portfolio foto i wideo — Patryk Paska

Strona prezentująca moje zdjęcia (motoryzacja, sport, portret) oraz rolki wideo tworzone dla firm. Projekt jest statyczną stroną w czystym HTML, CSS i JavaScripcie, hostowaną na Netlify.

## Funkcje

- galeria zdjęć z filtrowaniem po kategoriach (motoryzacja, sport, portret),
- powiększanie zdjęć w oknie modalnym z nawigacją strzałkami i klawiaturą,
- sekcja rolek wideo z automatycznymi miniaturami z YouTube i odtwarzaniem w oknie modalnym,
- animowane tło (Canvas API) z wyłączeniem ruchu dla osób, które mają włączoną preferencję `prefers-reduced-motion`,
- układ responsywny (telefon, tablet, komputer), efekt szkła (glassmorphism) i animacje pojawiania sekcji,
- dostępność: etykiety ARIA, obsługa klawiatury, zarządzanie fokusem w oknie modalnym.

## Technologie

- HTML5, CSS3 (zmienne CSS, grid, flexbox, media queries, `backdrop-filter`)
- JavaScript (ES6+, bez bibliotek i frameworków): DOM, Canvas API, IntersectionObserver
- osadzanie YouTube w trybie `youtube-nocookie`
- hosting: Netlify

## Struktura projektu

```
.
├── index.html            # struktura strony
├── css/
│   └── style.css         # style
├── js/
│   ├── config.js         # dane: kontakt, lista zdjęć i rolek
│   ├── main.js           # galeria, rolki, modal, filtry
│   └── background.js     # animowane tło na canvasie
└── assets/
    ├── logo.jpg          # logo (własny plik)
    ├── photos/           # zdjęcia w wersji webowej (ok. 2500 px)
    └── originals/        # oryginały bez kompresji (nieużywane przez stronę)
```

## Uruchomienie lokalnie

Strona nie wymaga budowania. Wystarczy otworzyć `index.html` w przeglądarce albo uruchomić prosty serwer:

```bash
python -m http.server 8000
```

Następnie wejść na `http://localhost:8000`.

## Jak dodać treści

Wszystkie dane są w `js/config.js`.

**Nowe zdjęcie:** wrzuć plik (ok. 2500 px szerokości, do ok. 500 KB) do `assets/photos/` i dopisz wpis do listy `photos`:

```js
{
  title: "Motoryzacja — 03",
  category: "moto",          // moto, sport lub portret
  categoryLabel: "Motoryzacja",
  src: "assets/photos/moto-03.jpg"
}
```

**Nowa rolka:** dopisz wpis do listy `reels` z linkiem do filmu na YouTube. Miniatura pobierze się automatycznie.

Nazwy plików zapisuj małymi literami (`.jpg`), bo hosting rozróżnia wielkość liter.

## Publikacja

Repozytorium jest połączone z Netlify. Każdy push do gałęzi `main` automatycznie publikuje nową wersję strony.

## O projekcie

Kod strony powstał z wykorzystaniem narzędzi AI, a za projekt, treści, strukturę i publikację odpowiadam ja. Zdjęcia i materiały wideo są mojego autorstwa.

## Licencja i prawa autorskie

Zdjęcia i materiały wideo są moją własnością i nie mogą być wykorzystywane bez zgody. Kod źródłowy strony możesz swobodnie przeglądać i traktować jako inspirację.
