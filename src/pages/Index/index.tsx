import React, { useEffect, useState } from "react";
import CardItem from "src/components/Cards/CardItem";
import axiosApi from "src/services/axios";
import { api_key } from "src/services/axios";
import { useLocation } from "react-router-dom";
import Loader from "src/components/Loader";

const Index = () => {
    const [data, setData] = useState<Array<any>>([]);
    const [loader, setLoader] = useState(false);
    const location = useLocation();
    const pathname = location.pathname;
    const checkLocation = pathname === "/filmes" ? "discover/movie" : pathname === "/series" ? "discover/tv" : pathname === "/home" ? "trending/all/day" : null
    const path: string = `${checkLocation}?${api_key}&sort_by=popularity.desc&page=1`;

    useEffect(() => {
        async function getData() {
            try {
                setLoader(true);
                const response = await axiosApi.get(path);
                setData(response?.data?.results);
            } catch (error) {
                console.log(error);
            } finally {
                setLoader(false);
            }
        };

        getData();

    }, [path]);

    return (
        <Loader isActive={loader}>
            <section className={`px-3 md:px-10 pt-24 pb-12`}>
                <div className={`grid grid-cols-12 justify-items-center items-center gap-3`}>
                    {data?.map((item) => {
                        const mediaType = item?.media_type === "movie" ? "filme" : item?.media_type === "tv" ? "serie" : null
                        const checkLocation = pathname === `/filmes` ? `filme` : pathname === `/series` ? `serie` : pathname === "/home" ? `${mediaType}` : null;
                        return (
                            <CardItem
                                props={{
                                    key: item?.id,
                                    poster_path: item?.poster_path,
                                    original_title: item?.original_title,
                                    to: `/${checkLocation}/${item?.id}`
                                }}
                            />
                        )
                    })}
                </div>
            </section>
        </Loader>
    )
}
export default Index;