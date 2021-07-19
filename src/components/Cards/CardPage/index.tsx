import React, { Fragment } from "react";
import Buttton from "src/components/Button";
import { Props } from "./types";

const CardPage = ({ props }: Props) => {
    const imagePath = "https://image.tmdb.org/t/p/original";
    const date = new Date(props?.date)?.getFullYear();

    return (
        <Fragment>
            <div className={`bg-fixed bg-center bg-cover h-screen py-24 px-5 grid items-center`}
                style={{ backgroundImage: `linear-gradient(to right, black, rgba(0,0,0,0.5)), url(${`${imagePath}/${props?.backdrop_path}`})` }}
            >
                <div key={props?.key} className={`p-5`}>
                    <div className={`text-white w-12/12 md:w-4/12`}>
                        <p className={`text-3xl font-bold whitespace-normal`}>{props?.title}</p>
                        <div className={`flex space-x-2 pb-2 items-center text-gray-500`}>
                            <p className={`text-sm`}>{date}</p>
                            <p className={`${props?.vote_average <= 4.0 ? "text-red-500" : "text-green-500"} text-white font-bold text-xs rounded-full py-1 px-2`}>
                                {props?.vote_average}
                            </p>
                            <span> | </span>
                            <p className={`text-sm`}>{props?.runtime} min</p>
                        </div>
                        <p className={`line-clamp-4 text-lg font-bold pt-2`} title={props?.tagline}>{props?.tagline}</p>
                        <p className={`text-sm line-clamp-6`} title={props?.sinopse}>{props?.sinopse}</p>
                    </div>
                    <div className={`flex justify-start space-x-3 text-sm text-white py-5 items-center`}>
                        <Buttton
                            props={{
                                type: "link",
                                title: "Trailer",
                                link: props?.title
                            }}
                        />
                        {
                            props?.isSalvo === false && (
                                <Buttton
                                    props={{
                                        type: "default",
                                        title: "Salvar",
                                        onClick: props?.salvarItem
                                    }}
                                />
                            )
                        }
                    </div>
                </div>
            </div>
        </Fragment>
    )
}
export default CardPage;