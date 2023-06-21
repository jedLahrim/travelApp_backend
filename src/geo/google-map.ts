import axios from "axios";

export class GoogleMap {
  static GET_LOCATION = async function (address: string) {
    const options = {
      method: "GET",
      url: X_RAPID_API_KEY,
      params: {
        address: address,
      },
      headers: {
        "X-RapidAPI-Key": X_RAPID_API_HOST,
        "X-RapidAPI-Host": X_RAPID_API_URL,
      },
    };

    try {
      const response = await axios.request(options);
      console.log(response.data);
      return response.data
    } catch (error) {
      console.error(error);
    }
  };
}
export const X_RAPID_API_KEY =
  "https://google-maps-geocoding3.p.rapidapi.com/geocode";
export const X_RAPID_API_HOST =
  "4fb84e5862msh93493191641aa67p1730ebjsn9a38755eabe6";
export const X_RAPID_API_URL = "google-maps-geocoding3.p.rapidapi.com";
