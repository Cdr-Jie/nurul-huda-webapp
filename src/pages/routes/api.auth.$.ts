import { auth } from '../../lib/auth'
import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router" // or "@remix-run/node"

export async function loader({ request }: LoaderFunctionArgs) {
    return auth.handler(request)
}

export async function action({ request }: ActionFunctionArgs) {
    return auth.handler(request)
}