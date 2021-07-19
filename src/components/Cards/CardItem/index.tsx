import React, { Fragment } from "react";
import { Props } from "./types";
import { Link } from "react-router-dom";
import { IoMdCloseCircle } from "react-icons/io";

const CardItem = ({ props }: Props) => {
    return (
        <Fragment key={props?.key}>
            <div className={`group col-span-6 sm:col-span-6 md:col-span-3 lg:col-span-3 xl:col-span-3 transform transition duration-300 ease-in-out hover:bg-gray-800 hover:scale-95 rounded-lg`}
                title={props?.original_title}>

                {
                    props?.type === "fav" && (
                        <p className={`opacity-100 md:opacity-0 text-pirataflix-clean_red group-hover:opacity-100 absolute right-0 z-20 -mt-2 -mr-2 bg-white rounded-full cursor-pointer transform hover:scale-105`}
                            onClick={props?.onClick}>
                            <IoMdCloseCircle size={`1.8rem`} />
                        </p>
                    )
                }

                <Link to={props?.to}>
                    <div className={`relative flex items-center justify-center p-0 md:p-5`}>
                        <img src={`https://image.tmdb.org/t/p/original/${props?.poster_path}`}
                            className={`opacity-100 group-hover:opacity-50 rounded-lg`}
                            alt={props?.original_title} />
                    </div>
                </Link>
            </div>
        </Fragment>
    )
}
export default CardItem;