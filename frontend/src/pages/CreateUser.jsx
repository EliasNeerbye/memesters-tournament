import { useState } from "react"

export default function CreateUser() {
    const [email, setEmail] = useState();
    const [password, setPassword] = useState();
    const [repeatPassword, setrepeatPassword] = useState();

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log(email)
        console.log(password)
        console.log(repeatPassword)
        axios.post("http://localhost:5000/api/users",
            {
                email: email,
                password: password,
                repeatPassword: repeatPassword
            }).then((response) => {
                console.log(response);
            }).catch((error) => {
                console.log("error", error)
            })
        )
    }


    return (
        <div>
            <h1>Hallo</h1>

            <form onSubmit={handleSubmit}>
                <input type="email" placeholder="email" onChange={(e) => {setEmail(e.target.value)}}/>
                <input type="password" placeholder="password" onChange={(e) => {setPassword(e.target.value)}}/>
                <input type="password" placeholder="repeat password" onChange={(e) => {setrepeatPassword(e.target.value)}}/>
                <button>Register User</button>
            </form>
        </div>
    )
}