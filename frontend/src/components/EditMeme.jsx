import React from 'react';

function EditMeme() {
    return (
        <div>
            <h1>Edit Meme</h1>
            <div className='flex flex-col justify-center items-center'>
                <form className='flex flex-col justify-center w-1/2' action="">
                    <label htmlFor="input1">input 1</label>
                    <input type="text"/>
                    <label htmlFor="input2">input 2</label>
                    <input type="text"/>
                    <label htmlFor="input3">input 3</label>
                    <input type="text"/>
                    <button type="submit">Submit</button>
                </form>
            </div>
        </div>
    )
}

export default EditMeme;