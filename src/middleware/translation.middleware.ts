import process from "process";

export class Translation {
  static async TRANSLATE(text, targetLanguage): Promise<string> {
    const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY;
    const url = `https://translation.googleapis.com/language/translate/v2?key=${apiKey}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        q: text,
        target: "en",
        source: "fr",
      }),
    });

    const data = await response.json();

    return data.data.translations[0].translatedText;
  }
}
