import React, { Fragment } from "react";
import { Link } from "react-router-dom";
import { Props } from "./types";

const Logo = ({ props }: Props) => {
    return (
        <Fragment>
            <Link to={`/home`}>
                <div className={`flex-shrink-0 flex items-center cursor-pointer`}>
                    <img
                        className={`block h-8 w-auto`}
                        src={props?.logoFile}
                        alt="LogoMobile"
                    />
                </div>
            </Link>
        </Fragment>
    )
}
export default Logo;