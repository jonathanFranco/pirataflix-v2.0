import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
// import CardFavorito from "src/components/Cards/CardFavorito";
import CardItem from "src/components/Cards/CardItem";
import Loader from "src/components/Loader";

const MinhaLista = () => {
    const [data, setData] = useState([]);
    const [loader, setLoader] = useState(false);

    useEffect(() => {
        try {
            setLoader(true);
            const minhaLista: any = localStorage.getItem(`minha-lista`);
            setData(JSON.parse(minhaLista) || []);
        } catch (error) {
            console.log(error)
        } finally {
            setLoader(false);
        }

    }, []);

    function deleteItem(id: number) {
        let filterItem = data?.filter((item: any) => item?.id !== id);
        setData(filterItem);
        localStorage.setItem(`minha-lista`, JSON.stringify(filterItem));
        toast.success(`Excluído na sua lista!`);
    }

    return (
        <Loader isActive={loader}>
            <section className={`px-3 pt-16 pb-12`}>
                <p className={`text-3xl font-bold text-white pt-10 pb-5 text-center`}>Minha Lista</p>
                {data?.length === 0 && (
                    <p className={`text-base font-bold text-gray-800 text-center`}>Sua lista está vazia :(</p>
                )}
                <div className={`grid grid-cols-12 justify-items-center items-center gap-3`}>
                    {data?.map((item: any) => {
                        const mediaType = item?.in_production ? "serie" : "filme";
                        return (
                            <CardItem
                                props={{
                                    key: item?.id,
                                    poster_path: item?.poster_path,
                                    to: `/${mediaType}/${item?.id}`,
                                    original_title: item?.original_title,
                                    type: "fav",
                                    onClick: () => deleteItem(item?.id)
                                }}
                            />
                        )
                    })}
                </div>
            </section>
        </Loader>

    )
}
export default MinhaLista;