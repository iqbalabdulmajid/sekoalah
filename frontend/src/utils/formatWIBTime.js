import dayjs from "./dayjsConfig";

const formatWIBTime = (waktu) => {
  const isLocalhost = window.location.hostname === "localhost";

  if (isLocalhost) {
    return new Date(waktu).toLocaleString("id-ID", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } else {
    return dayjs.utc(waktu).tz("Etc/GMT+7").format("DD MMM YYYY, HH:mm");
  }
};

export default formatWIBTime;