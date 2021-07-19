import React from "react";
import {
    Switch,
    Route,
    Redirect
} from 'react-router-dom';
import Header from "./components/Header";
import IndexPage from "./pages/IndexPage";
import Index from "./pages/Index";
import MinhaLista from "./pages/MinhaLista";
// import Error from "./pages/Error";

const Routes = () => {
    return (
        <Route path={`/`}>
            <Header />
            <Switch>
                <Route path="/home" exact component={Index} />
                <Route path="/filmes" exact component={Index} />
                <Route path="/filme/:id" exact component={IndexPage} />
                <Route path="/series" exact component={Index} />
                <Route path="/serie/:id" exact component={IndexPage} />
                <Route path="/minha-lista" exact component={MinhaLista} />
                {/* <Route path="*" component={Error} /> */}
                <Redirect to="/home" />
            </Switch>
        </Route>
    )
}
export default Routes;