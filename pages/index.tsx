import type { NextPage } from "next";
import Head from "next/head";
import Image from "next/image";
import React, { useCallback, useEffect, useState } from "react";
import Speech from "speak-tts";
import styles from "../styles/Home.module.css";

const sleep = (seconds: number): Promise<void> => {
  return new Promise((resolve) => {
    setTimeout(resolve, seconds * 1000);
  });
};

type SpeakState = "unstarted" | "playing" | "paused";

type Type = "start" | "row-start" | "stitch" | "row-end" | "end";

type TextLine = {
  type: Type;
  displayText: string;
  speechText: string;
};

const Home: NextPage = () => {
  const [speech, setSpeech] = useState<any>();
  const [isSupported, setIsSupported] = useState<boolean>();
  const [speechOptions, setSpeechOptions] = useState<any[]>();
  const [language, setLanguage] = useState<string>();
  const [voice, setVoice] = useState<string>();

  const [colorA, setColorA] = useState<string>();
  const [colorB, setColorB] = useState<string>();

  const [file, setFile] = useState<File>();
  const [text, setText] = useState<TextLine[]>();
  const [textIndex, setTextIndex] = useState<number>(0);

  const [delay, setDelay] = useState<number>(2);

  const [currentState, setCurrentState] = useState<SpeakState>("unstarted");

  const [error, setError] = useState<string>("");

  useEffect(() => {
    const init = async () => {
      // @ts-expect-error
      const speech = new Speech();
      const speechData = await speech.init({
        volume: 0.5,
        lang: "en-US",
        rate: 0.8,
        pitch: 1,
        listeners: {
          onvoiceschanged: (voices: any[]) => {
            console.log("Voices changed", voices);
          },
        },
      });
      setSpeech(speech);
      setSpeechOptions(speechData.voices);
      setLanguage(speechData.voices[0].lang);
      setIsSupported(speech.hasBrowserSupport());
    };

    init();
  }, []);

  useEffect(() => {
    if (speech && language) {
      speech.setLanguage(language);
    }
  }, [speech, language]);

  useEffect(() => {
    if (speech && voice) {
      speech.setVoice(voice);
    }
  }, [speech, voice]);

  const speak = useCallback(
    (text: string) => {
      speech.speak({
        text,
        queue: false,
        listeners: {
          onstart: () => {
            console.log("Start utterance");
          },
          onend: () => {
            console.log("End utterance");
          },
          onresume: () => {
            console.log("Resume utterance");
          },
          onboundary: (event: any) => {
            console.log(
              event.name +
                " boundary reached after " +
                event.elapsedTime +
                " milliseconds."
            );
          },
        },
      });
    },
    [speech]
  );

  useEffect(() => {
    const play = async () => {
      if (text && textIndex < text.length) {
        const textToPlay = text[textIndex].speechText;
        speak(textToPlay);
        await sleep(delay);
        setTextIndex((textIndex) => textIndex + 1);
      } else {
        setCurrentState("unstarted");
      }
    };

    if (text && currentState === "playing") {
      play();
    }
  }, [text, currentState, textIndex, speak, delay]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files ? e.target.files[0] : undefined;
    setFile(file);
  };

  const handleSubmit = async () => {
    try {
      const textResponse = await fetch("/api/file-to-text", {
        method: "POST",
        headers: {
          "x-knitspeak-color-a": colorA ?? "",
          "x-knitspeak-color-b": colorB ?? "",
        },
        body: file,
      });

      if (textResponse.status === 200) {
        const { text } = await textResponse.json();
        setText(text);
      } else {
        const { error } = await textResponse.json();
        setError(error);
        setText(undefined);
      }
    } catch (e: any) {
      setError(e.message);
      setText(undefined);
    }

    return false;
  };

  const handleSpeechOption = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedVoiceURI = e.target.selectedOptions[0]?.value;
    const selectedSpeechOption = speechOptions?.find(
      (speechOption) => speechOption.voiceURI === selectedVoiceURI
    );
    if (selectedSpeechOption) {
      setVoice(selectedSpeechOption.name);
    }
  };

  const handleDelay = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (currentState !== "playing") {
      setDelay(Number.parseFloat(e.target.value));
    }
  };

  const handlePlay = async () => {
    setCurrentState("playing");
  };

  const handlePause = () => {
    setCurrentState("paused");
  };

  const getStartIndex = () => {
    if (!text || textIndex === 0 || textIndex === 1) {
      return 0;
    }

    return Math.min(textIndex - 1, text.length - 5);
  };

  const getEndIndex = () => {
    if (!text) {
      return 0;
    }
    const startingIndex = getStartIndex();
    return Math.min(startingIndex + 5, text.length);
  };

  return (
    <div className={styles.container}>
      <Head>
        <title>KnitSpeak</title>
        <meta name="description" content="Read aloud your knitting patterns" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>Welcome to KnitSpeak</h1>

        <p className={styles.description}>
          Get started by uploading a CSV of your knitting pattern:
        </p>
        {text && isSupported && (
          <div>
            <h2 style={{ textAlign: "center" }}>Pattern Data</h2>
            <div
              style={{
                display: "block",
                margin: "0 auto",
                width: "max-content",
                textAlign: "center",
              }}
            >
              {text.map((textLine, i) => {
                const startIndex = getStartIndex();
                const endIndex = getEndIndex();
                if (i >= startIndex && i < endIndex) {
                  return (
                    <p
                      key={i}
                      style={{
                        backgroundColor:
                          i === textIndex ? "yellow" : "transparent",
                      }}
                    >
                      {i === textIndex && <>&rarr; </>}
                      {textLine.displayText}{" "}
                      {i === textIndex &&
                        textLine.type === "stitch" &&
                        "(Next stitch)"}
                    </p>
                  );
                }
              })}
            </div>
            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-evenly",
                }}
              >
                {currentState !== "playing" && textIndex < text.length && (
                  <button id="play" name="play" onClick={handlePlay}>
                    Play
                  </button>
                )}
                {currentState === "playing" && (
                  <button id="pause" name="pause" onClick={handlePause}>
                    Pause
                  </button>
                )}
              </div>
              {currentState !== "playing" && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-evenly",
                    margin: "1rem 0",
                    minWidth: "240px",
                  }}
                >
                  <button
                    id="prev"
                    name="prev"
                    onClick={() =>
                      setTextIndex((currIndex) => Math.max(0, currIndex - 1))
                    }
                  >
                    Previous
                  </button>
                  <button
                    id="next"
                    name="next"
                    onClick={() =>
                      setTextIndex((currIndex) =>
                        Math.min(text.length - 1, currIndex + 1)
                      )
                    }
                  >
                    Next
                  </button>
                </div>
              )}
              <div style={{ margin: "1rem 0" }}>
                <label>
                  <span>Delay between instructions</span>
                  {currentState === "playing" && (
                    <>
                      <br />
                      <span>(You must pause before changing)</span>
                    </>
                  )}
                </label>
                <br />
                <input
                  id="delay"
                  type="range"
                  min="1"
                  max="10"
                  step="0.1"
                  name="delay"
                  value={delay}
                  readOnly={currentState === "playing" ? true : false}
                  onChange={handleDelay}
                />
                <p>Current delay: {delay}</p>
              </div>
              <br />
              <div>
                <label htmlFor="language">Language: </label>
                <select
                  onChange={(e) =>
                    setLanguage(e.target.selectedOptions[0]?.value)
                  }
                  name="language"
                >
                  {speechOptions
                    ?.reduce<string[]>((langs, speechOption) => {
                      return langs.includes(speechOption.lang)
                        ? langs
                        : [...langs, speechOption.lang];
                    }, [])
                    .map((lang, i) => (
                      <option key={i} value={lang}>
                        {lang}
                      </option>
                    ))}
                </select>
              </div>
              <br />
              <div>
                <label htmlFor="voice">Voice: </label>
                <select onChange={handleSpeechOption} name="voice">
                  {speechOptions?.map((speechOption, i) => (
                    <option
                      key={i}
                      value={speechOption.voiceURI}
                      hidden={speechOption.lang !== language}
                    >
                      {speechOption.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}
        {!isSupported && (
          <div>
            Your browser does NOT support KnitSpeak. Try using a different
            browser.
          </div>
        )}
        <div className={styles.grid}>
          <div>
            <label htmlFor="file">File:</label>
            <span> </span>
            <input
              id="file-upload"
              type="file"
              name="file"
              onChange={handleFileChange}
            ></input>
            <br />
            <br />
            <label htmlFor="color-a">Color A: </label>
            <input
              id="color-a"
              name="color-a"
              onChange={(e) => setColorA(e.target.value)}
            />
            <br />
            <label htmlFor="color-b">Color B: </label>
            <input
              id="color-b"
              name="color-b"
              onChange={(e) => setColorB(e.target.value)}
            />
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                marginTop: "1rem",
              }}
            >
              <button onClick={handleSubmit}>Upload</button>
            </div>
          </div>
        </div>
        {error && <p>{error}</p>}
      </main>

      <footer className={styles.footer}>
        <a
          href="https://vercel.com?utm_source=create-next-app&utm_medium=default-template&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          Powered by{" "}
          <span className={styles.logo}>
            <Image src="/vercel.svg" alt="Vercel Logo" width={72} height={16} />
          </span>
        </a>
      </footer>
    </div>
  );
};

export default Home;
