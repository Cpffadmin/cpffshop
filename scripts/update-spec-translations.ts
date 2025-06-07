import axios, { AxiosError } from "axios";

async function updateSpecTranslations() {
  try {
    const response = await axios.post(
      "http://localhost:3000/api/admin/specifications/update-translations"
    );
    console.log("Response:", response.data);
  } catch (error) {
    if (error instanceof AxiosError) {
      console.error("Error:", error.response?.data || error.message);
    } else {
      console.error("Error:", error);
    }
  }
}

updateSpecTranslations();
