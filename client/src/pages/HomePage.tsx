const HomePage = () => {
	return (
		<div className="text-left max-h-[800px] overflow-y-scroll">
			<h1 className="text-3xl mb-4">
				PROPOJÍME RADNICI A DEVELOPERY S OSTRAVSKÝMI OBČANY!
			</h1>
			<div>
				<p className="my-3 text-xl">
					Představujeme Vám mapovou webovou aplikaci pro občany Ostravy, kteří
					chtějí vědět, co se v jejich městě zrovna staví, plánuje nebo otevírá.
				</p>
				<p className="my-3 text-xl">
					Najdete zde i nové ostravské přírůstky v rámci kultury a gastroscény.
				</p>
				<p className="my-3 text-xl">
					Do boudoucna máme v plánu vytvořit i katalog sportovišť napříč celým
					městem a jeho částmi.
				</p>
				<p className="my-3 text-xl">
					V tuto chvíli nespolupracujeme s žádnou organizací, firmou či
					institucí a vše děláme na vlastní triko.
				</p>
				<img
					src="src/assets/images/cat.gif"
					alt="ostravision logo"
					width={250}
				/>
			</div>
		</div>
	);
};

export default HomePage;
