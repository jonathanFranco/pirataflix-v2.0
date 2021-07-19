import Axios from "axios";

const token = localStorage.getItem("token-cliente");

if (
  window.location.protocol !== "https:" &&
  process.env.NODE_ENV === "production" &&
  window.location.hostname !== "localhost" &&
  window.location.hostname !== "127.0.0.1"
) {
  window.location.replace(
    `https:${window.location.href.substring(window.location.protocol.length)}`
  );
}

export const api_key = "api_key=841f21ef9e7cfd7c23c9d1e28a153733";

export const axiosApi = Axios.create({
  baseURL: `https://api.themoviedb.org/3/`,
  // baseURL: process.env.REACT_APP_AXIOS_BASE_URL,
  timeout: 240000,
  headers: {
    Authorization: token ? `bearer ${token}` : "",
    "Content-Type": "application/json",
  },
});

export const axiosApiAll = (...paths) => {
  Promise.all(
    paths.map((path) => {
      return axiosApi[`${path.method}`](
        `${path.path}`,
        path.data ? path.data : null
      );
    })
  ).then((response) => {
    return response.map((resposta) => resposta.data);
  });
};

// export const errorInterceptor = axiosApi.interceptors.response.use(
//     function (response: any) {
//         return response;
//     }, async function (error: any) {
//         if (error.response.status === 401) {
//             localStorage.clear();
//             localStorage.setItem('hasTheSessionExpired', 'true');
//             window.location.reload();
//         }
//         return Promise.reject(error);
//     }
// );

export const refreshToken = () => {
  const expiresIn = String(localStorage.getItem("cliente-expires"));
  setTimeout(
    async () => {
      let response = await axiosApi.post("/refresh");
      const { access_token, expires_in } = response.data;
      localStorage.setItem("token-cliente", access_token);
      localStorage.setItem("expires", expires_in.toString());
      axiosApi.defaults.headers.common[
        "authorization"
      ] = `bearer ${access_token}`;
    },
    expiresIn - 300,
    () => refreshToken()
  );
};

export default axiosApi;
