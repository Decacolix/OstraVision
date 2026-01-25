/* About page component. */
const AboutPage = () => {
	return (
		<div className="flex flex-col sm:flex-row justify-center items-center sm:items-start gap-6">
			<div className="max-w-[50%] flex flex-col items-center">
				<img
					className="rounded-full"
					src="src/assets/images/filip_polzer_profile.jpg"
					alt="David Toman"
					width={'150px'}
				/>
				<h3 className="text-2xl font-bold mt-2">Filip Polzer</h3>
				<p className="text-gray-600">Tvůrce</p>
				<div className="flex gap-3 mt-2">
					<span>
						<a
							href="https://www.linkedin.com/in/filippolzer1998/"
							target="_blank"
						>
							<img
								src="src/assets/icons/linkedin.svg"
								alt="LinkedIn"
								width={'30px'}
							/>
						</a>
					</span>
					<span className="h-6">
						<a href="mailto:filippolzer98@gmail.com" target="_blank">
							<img
								src="src/assets/icons/email.svg"
								alt="Email"
								width={'30px'}
							/>
						</a>
					</span>
				</div>
				<div>
					<span className="text-2xl font-bold">„</span>
					<p className="italic">
						Tento projekt jsem chtěl vytvořit, abych umožnil lidem nejen z
						Ostravy a okolí získat přehledně informace o nových projektech.
					</p>
					<span className="text-2xl font-bold">“</span>
				</div>
			</div>
			<div className="max-w-[50%] flex flex-col items-center ">
				<img
					className="rounded-full"
					src="src/assets/images/david_toman_profile.jpg"
					alt="David Toman"
					width={'150px'}
				/>
				<h3 className="text-2xl font-bold mt-2">David Toman</h3>
				<p className="text-gray-600">Programátor</p>
				<div className="flex gap-3 mt-2">
					<span>
						<a href="https://www.linkedin.com/in/dtoman1997/" target="_blank">
							<img
								src="src/assets/icons/linkedin.svg"
								alt="LinkedIn"
								width={'30px'}
							/>
						</a>
					</span>
					<span className="h-6">
						<a href="mailto:davidtoman1997@gmail.com" target="_blank">
							<img
								src="src/assets/icons/email.svg"
								alt="Email"
								width={'30px'}
							/>
						</a>
					</span>
				</div>
				<div>
					<span className="text-2xl font-bold">„</span>
					<p className="italic">
						Jsem rád, že se mohu podílet na tomto perspektivním projektu, který
						lidem přiblíží zajímavosti z Ostravska.
					</p>
					<span className="text-2xl font-bold">“</span>
				</div>
			</div>
		</div>
	);
};

export default AboutPage;
