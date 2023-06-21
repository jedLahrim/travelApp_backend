import axios from "axios";
import { Constant } from "../commons/constant";

export class Translation {
  static async TRANSLATE(text: string, to_lang: string): Promise<string> {
    const from_lang = await _detectLanguage(text);
    const encodedParams = _getEncodeParams(
      text,
      from_lang.language_code,
      to_lang
    );
    const data = await _handelTranslationRequest(encodedParams, "translate");
    return data.translated_text;
  }
}
function _getEncodeParams(text: string, from_lang: string, to_lang: string) {
  const encodedParams = new URLSearchParams();
  encodedParams.set("text", text);
  encodedParams.set("to_lang", to_lang);
  encodedParams.set("from_lang", from_lang);
  return encodedParams;
}
async function _detectLanguage(text: string) {
  const encodedParams = new URLSearchParams();
  encodedParams.set("text", text);
  return _handelTranslationRequest(encodedParams, "detect");
}
async function _handelTranslationRequest(encodedParams, param: string) {
  const options = {
    method: "POST",
    url: `https://google-translate105.p.rapidapi.com/v1/rapid/${param}`,
    headers: Constant.TRANSLATION_HEADERS,
    data: encodedParams,
  };
  try {
    const response = await axios.request(options);
    return response.data;
  } catch (error) {
    console.error(error);
  }
}
