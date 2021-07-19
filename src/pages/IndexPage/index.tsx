import React, { Fragment, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axiosApi from "src/services/axios";
import { api_key } from "src/services/axios";
import { useLocation, useHistory } from "react-router-dom";
import CardPage from "../../components/Cards/CardPage";
import Loader from "src/components/Loader";
import { toast } from "react-toastify";

const IndexPage = () => {
    const { id }: any = useParams();
    const [data, setData] = useState<any>([]);
    const [loader, setLoader] = useState(false);
    const location = useLocation();
    const history = useHistory();
    const pathname = location.pathname;
    const checkLocation = pathname === `/filme/${id}` ? `/movie/${id}` : pathname === `/serie/${id}` ? `/tv/${id}` : null
    const path: string = `${checkLocation}?${api_key}`;
    const lista: any = localStorage.getItem(`minha-lista`);
    let salvos = JSON.parse(lista) || [];
    const hasItem = salvos?.some((item: any) => item.id === data?.id);

    useEffect(() => {
        async function getData() {
            try {
                setLoader(true);
                const response = await axiosApi.get(path);
                setData(response.data);
            } catch (error) {
                console.log(error);
                history.push(`/`);
            } finally {
                setLoader(false);
            }
        };

        getData();

    }, [id, path, history]);

    function salvarItem() {
        salvos?.push(data);
        localStorage.setItem(`minha-lista`, JSON.stringify(salvos));
        toast.success(`Adicionado na sua lista!`);
        setTimeout(() => {
            history.go(0)
        }, 1500);
    }

    return (
        <Fragment>
            <Loader isActive={loader}>
                <CardPage
                    props={{
                        key: id,
                        title: data?.original_title || data?.original_name,
                        sinopse: data?.overview,
                        backdrop_path: data?.backdrop_path,
                        date: data?.release_date || data?.first_air_date,
                        runtime: data?.runtime || data?.episode_run_time,
                        vote_average: data?.vote_average,
                        tagline: data?.tagline,
                        isSalvo: hasItem,
                        salvarItem: salvarItem
                    }
                    }
                />
            </Loader>
        </Fragment>
    )
}
export default IndexPage;