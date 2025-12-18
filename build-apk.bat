@echo off
echo Configurando Java...
set JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-21.0.9.10-hotspot
set PATH=%JAVA_HOME%\bin;%PATH%

echo Verificando Java...
java -version
if errorlevel 1 (
    echo ERRORE: Java non trovato!
    echo Assicurati che Java sia installato correttamente.
    pause
    exit /b 1
)

echo.
echo Costruendo l'app web...
call npm run build
if errorlevel 1 (
    echo ERRORE: Build dell'app web fallita!
    pause
    exit /b 1
)

echo.
echo Sincronizzando con Capacitor...
call npx cap sync android
if errorlevel 1 (
    echo ERRORE: Sincronizzazione fallita!
    pause
    exit /b 1
)

echo.
echo Generando APK (questo potrebbe richiedere alcuni minuti)...
cd android
call gradlew.bat assembleDebug
if errorlevel 1 (
    echo ERRORE: Generazione APK fallita!
    cd ..
    pause
    exit /b 1
)

cd ..
echo.
echo ========================================
echo APK generato con successo!
echo.
echo L'APK si trova in:
echo android\app\build\outputs\apk\debug\app-debug.apk
echo ========================================
pause

