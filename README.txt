FOODBOK — wersja 1

ZAWARTOŚĆ:
- index.html — cała aplikacja
- images/ — zdjęcia wycięte z przesłanych zrzutów ekranu
- manifest.webmanifest i icon.svg — ikona i tryb aplikacji

PUBLIKACJA PRZEZ GITHUB PAGES:
1. Wejdź na github.com i utwórz nowe repozytorium np. foodbok.
2. Rozpakuj archiwum ZIP i prześlij CAŁĄ jego zawartość do repozytorium (index.html na głównym poziomie).
3. W Settings > Pages ustaw Deploy from a branch, branch main, folder / (root), Save.
4. Link będzie miał format https://TWOJ-LOGIN.github.io/foodbok/ (po opublikowaniu).
5. Otwórz link w Safari na iPhonie, wybierz Udostępnij > Dodaj do ekranu początkowego.

WAŻNE:
Dane użytkowników są przechowywane lokalnie na urządzeniu (localStorage). GitHub Pages publikuje jedynie pliki strony. Zmiany wprowadzane na jednym telefonie NIE są automatycznie widoczne na drugim. Do synchronizacji między telefonami potrzebny jest backend, np. Firebase lub Supabase.
Kalorie/makro z przesłanych screenów są szacunkowe. Domyślnie nic nie jest zaznaczone jako zjedzone. Po wyborze innego posiłku w danym dniu jego checkbox jest odznaczany.
Lista zakupów: zaznaczony przepis jest liczony RAZ DZIENNIE przez wybraną liczbę dni dla zaznaczonych osób. Nie jest to jeszcze automatyczne zliczanie różnych jadłospisów w poszczególne dni.
