/* Not found page, shown when the error 404 occurs. */
const NotFound = () => {
	return (
		<div className="flex flex-col justify-center items-center">
			<p className="text-8xl font-bold">
				<span className="text-odb">4</span>
				<span className="text-olb">0</span>
				<span className="text-odb">4</span>
			</p>
			<p className="text-2xl font-bold my-4">Tato stránka neexistuje.</p>
			<img src="/src/assets/images/cat.gif" alt="cat" width={250} />
		</div>
	);
};

export default NotFound;
