const https = require("https");

function reverseGeocode(latitude, longitude) {
  return new Promise((resolve, reject) => {
    const url =
      `https://nominatim.openstreetmap.org/reverse` +
      `?format=jsonv2` +
      `&lat=${encodeURIComponent(latitude)}` +
      `&lon=${encodeURIComponent(longitude)}` +
      `&zoom=10` +
      `&addressdetails=1`;

    const request = https.get(
      url,
      {
        headers: {
          "User-Agent": "Civix-Student-Project/1.0"
        }
      },
      (response) => {
        let data = "";

        response.on("data", (chunk) => {
          data += chunk;
        });

        response.on("end", () => {
          if (response.statusCode !== 200) {
            return reject(
              new Error(`Reverse geocoding failed: ${response.statusCode}`)
            );
          }

          try {
            const result = JSON.parse(data);

            const address = result.address || {};

            const city =
              address.city ||
              address.town ||
              address.village ||
              address.municipality ||
              "";

            const state = address.state || "";
            const country = address.country || "";

            const locationParts = [city, state, country].filter(Boolean);

            resolve({
              location: locationParts.join(", "),
              displayName: result.display_name || "",
              address
            });
          } catch (error) {
            reject(error);
          }
        });
      }
    );

    request.on("error", reject);

    request.setTimeout(10000, () => {
      request.destroy();
      reject(new Error("Reverse geocoding request timed out"));
    });
  });
}

module.exports = {
  reverseGeocode
};